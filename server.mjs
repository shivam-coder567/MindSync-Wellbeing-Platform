import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is missing from .env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
});

/*
|--------------------------------------------------------------------------
| MindSync AI personality
|--------------------------------------------------------------------------
*/

const MINDSYNC_SYSTEM_PROMPT = `
You are MindSync, a supportive wellbeing companion designed for college students.

Your personality:
- Warm
- Calm
- Patient
- Non-judgmental
- Conversational
- Encouraging
- Respectful

Your job is to help students talk through what they are experiencing
and identify small, realistic next steps.

Conversation style:
- Listen first.
- Acknowledge the student's feelings.
- Reflect the main concern briefly.
- Ask a gentle follow-up question when useful.
- Offer one or two practical suggestions when appropriate.
- Keep responses reasonably concise.
- Use simple, natural language.
- Never sound robotic.
- Never overwhelm the student with a huge list of advice.

For example, if a student says:
"I'm stressed about exams."

Do NOT immediately give ten study tips.

Instead, respond naturally, for example:
"That sounds really heavy, especially when everything feels like it
needs your attention at once. What part of the exams feels most
overwhelming right now?"

Important boundaries:
- You are not a doctor.
- You are not a therapist.
- You are not a psychiatrist.
- You are not an emergency service.
- Do not diagnose mental-health conditions.
- Do not claim certainty about someone's mental-health state.
- Do not pretend to replace professional care.
- Never shame, judge, mock, or dismiss the student.

Safety:
If the student mentions suicide, self-harm, wanting to die,
or immediate danger:

1. Take the statement seriously.
2. Respond with empathy.
3. Encourage them to contact emergency services or immediate local help.
4. Encourage them to reach out to a trusted person nearby.
5. Encourage them not to remain alone if they may be in immediate danger.
6. Encourage professional mental-health support.
7. Do not provide instructions, methods, or encouragement for self-harm.

Do not make the conversation unnecessarily alarming when there is
no indication of immediate danger.

Formatting:
- Do not use unnecessary headings.
- Avoid long bullet lists.
- Keep normal responses around 2-5 short paragraphs.
- You may use one short question at the end.
`;

/*
|--------------------------------------------------------------------------
| Clean conversation history
|--------------------------------------------------------------------------
*/

function normalizeHistory(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter(
      (item) =>
        item &&
        typeof item.text === "string" &&
        item.text.trim() &&
        (item.sender === "student" || item.sender === "mindSync"),
    )
    .slice(-20)
    .map((item) => ({
      role: item.sender === "student" ? "user" : "model",
      parts: [
        {
          text: item.text.trim(),
        },
      ],
    }));
}

/*
|--------------------------------------------------------------------------
| Detect temporary Gemini errors
|--------------------------------------------------------------------------
*/

function isTemporaryError(error) {
  const text = JSON.stringify(error);

  return (
    text.includes("503") ||
    text.includes("UNAVAILABLE") ||
    text.includes("429") ||
    text.includes("RESOURCE_EXHAUSTED") ||
    text.includes("500") ||
    text.includes("502") ||
    text.includes("504")
  );
}

/*
|--------------------------------------------------------------------------
| Wait helper
|--------------------------------------------------------------------------
*/

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
|--------------------------------------------------------------------------
| Gemini generation
|--------------------------------------------------------------------------
|
| We use Gemini 2.5 Flash first because it is a stable,
| cost-effective model for this kind of conversational workload.
|
*/

async function generateWithRetry(history) {
  const models = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
  ];

  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying Gemini model: ${model} (attempt ${attempt})`);

        const response = await ai.models.generateContent({
          model,
          systemInstruction: MINDSYNC_SYSTEM_PROMPT,
          contents: history,
        });

        const text = response.text?.trim();

        if (!text) {
          throw new Error("Gemini returned an empty response.");
        }

        console.log(`✅ Gemini response generated with: ${model}`);

        return text;
      } catch (error) {
        lastError = error;

        console.error(
          `❌ Gemini model ${model} failed:`,
          JSON.stringify(error),
        );

        if (!isTemporaryError(error)) {
          throw error;
        }

        if (attempt < 2) {
          const delay = 1500 * attempt;

          console.log(`Waiting ${delay}ms before retrying...`);

          await sleep(delay);
        }
      }
    }
  }

  throw lastError;
}

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "MindSync AI",
  });
});

/*
|--------------------------------------------------------------------------
| Chat endpoint
|--------------------------------------------------------------------------
*/

app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    const trimmedMessage = message.trim();

    const history = normalizeHistory(messages);

    /*
     * Make sure the current user message exists
     * exactly once at the end of the conversation.
     */

    const lastMessage = history[history.length - 1];

    if (
      !lastMessage ||
      lastMessage.role !== "user" ||
      lastMessage.parts?.[0]?.text !== trimmedMessage
    ) {
      history.push({
        role: "user",
        parts: [
          {
            text: trimmedMessage,
          },
        ],
      });
    }

    console.log("MindSync AI received:", trimmedMessage);

    const text = await generateWithRetry(history);

    console.log("MindSync response generated successfully.");

    return res.json({
      response: text,
    });
  } catch (error) {
    console.error("Final Gemini error:", JSON.stringify(error));

    return res.status(503).json({
      error: "MindSync AI is temporarily busy. Please try again in a moment.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(`MindSync AI server running at http://localhost:${PORT}`);
});
