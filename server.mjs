import "node:fs";
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

/* Load .env from the project root so process.env is populated. */
try { process.loadEnvFile(); } catch { /* .env is optional — env vars may come from the host */ }

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("❌ GROQ_API_KEY is missing from .env");
  process.exit(1);
}

const groq = new Groq({ apiKey });

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
| Clean conversation history (OpenAI-compatible format for Groq)
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
      role: item.sender === "student" ? "user" : "assistant",
      content: item.text.trim(),
    }));
}

/*
|--------------------------------------------------------------------------
| Detect temporary API errors
|--------------------------------------------------------------------------
*/

function isTemporaryError(error) {
  const text = JSON.stringify(error);

  /* 404 model-not-found is permanent for that model — try the next one. */
  if (error?.status === 404 || text.includes("model_not_found") || text.includes("does not exist")) {
    return false;
  }

  return (
    text.includes("503") ||
    text.includes("UNAVAILABLE") ||
    text.includes("429") ||
    text.includes("RATE_LIMITED") ||
    text.includes("RESOURCE_EXHAUSTED") ||
    text.includes("500") ||
    text.includes("502") ||
    text.includes("504") ||
    text.includes("overloaded")
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
| Groq generation with fallback models
|--------------------------------------------------------------------------
*/

const GROQ_MODELS = [
  "allam-2-7b",
  "groq/compound-mini",
  "qwen/qwen3.6-27b",
];

async function generateWithRetry(messages) {
  let lastError = null;

  for (const model of GROQ_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying Groq model: ${model} (attempt ${attempt})`);

        const response = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: MINDSYNC_SYSTEM_PROMPT },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });

        const text = response.choices?.[0]?.message?.content?.trim();

        if (!text) {
          throw new Error("Groq returned an empty response.");
        }

        console.log(`✅ Groq response generated with: ${model}`);
        return text;
      } catch (error) {
        lastError = error;
        console.error(
          `❌ Groq model ${model} failed:`,
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
    provider: "groq",
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
      lastMessage.content !== trimmedMessage
    ) {
      history.push({
        role: "user",
        content: trimmedMessage,
      });
    }

    console.log("MindSync AI received:", trimmedMessage);

    const text = await generateWithRetry(history);

    console.log("MindSync response generated successfully.");

    return res.json({
      response: text,
    });
  } catch (error) {
    console.error("Final Groq error:", JSON.stringify(error));

    return res.status(503).json({
      error: "MindSync AI is temporarily busy. Please try again in a moment.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Wellness insight endpoint
|--------------------------------------------------------------------------
*/

const WELLNESS_SYSTEM_PROMPT = `
You are MindSync Wellness Insights — a supportive, non-diagnostic wellbeing
analysis tool for college students.

You receive structured data about a student's personal wellbeing patterns.
Your job is to provide a calm, supportive, brief insight.

Rules:
- NEVER diagnose mental-health conditions.
- NEVER use clinical language like "you have depression" or "you have anxiety".
- NEVER claim certainty. Use phrases like "Your recent check-ins suggest..."
  or "It looks like..." or "You've reported...".
- Keep the insight to 2-4 short sentences.
- Acknowledge positive trends when present.
- Gently flag when something seems different from the student's own baseline.
- If stress is higher than baseline, suggest a calming activity.
- If mood is lower than baseline, suggest reaching out or doing something restorative.
- Always end with a supportive, empowering sentence.
- Do NOT repeat the raw data back. Interpret the pattern.
- Never mention that you are an AI.

Tone: warm, calm, encouraging, concise.
`;

app.post("/api/wellness-insight", async (req, res) => {
  try {
    const { metrics } = req.body;

    if (!metrics || typeof metrics !== "object") {
      return res.status(400).json({ error: "Metrics object is required." });
    }

    const prompt = buildWellnessPrompt(metrics);

    console.log("Wellness insight requested.");

    let lastError = null;

    for (const model of GROQ_MODELS) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: WELLNESS_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 512,
        });

        const text = response.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error("Empty response from Groq.");

        console.log(`✅ Wellness insight generated with: ${model}`);
        return res.json({ insight: text });
      } catch (error) {
        lastError = error;
        console.error(`❌ Wellness model ${model} failed:`, error?.message || error);
        if (!isTemporaryError(error)) break;
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Wellness insight error:", error?.message || error);
    return res.status(503).json({
      error: "Insight unavailable right now.",
    });
  }
});

function buildWellnessPrompt(metrics) {
  const parts = [];
  parts.push("Analyze the following personal wellbeing patterns and provide a brief supportive insight.");
  parts.push("");

  if (metrics.checkInCount !== undefined) {
    parts.push(`Total check-ins: ${metrics.checkInCount}`);
  }
  if (metrics.daysCovered !== undefined) {
    parts.push(`Days of data: approximately ${metrics.daysCovered}`);
  }

  parts.push("");
  parts.push("Recent averages (last ~10 days):");
  if (metrics.recentMood !== null) parts.push(`- Mood: ${metrics.recentMood}/5`);
  if (metrics.recentStress !== null) parts.push(`- Stress: ${metrics.recentStress}/5`);
  if (metrics.recentAnxiety !== null) parts.push(`- Anxiety: ${metrics.recentAnxiety}/5`);

  parts.push("");
  parts.push("Personal baseline (older data): ");
  if (metrics.baselineMood !== null) parts.push(`- Mood baseline: ${metrics.baselineMood}/5`);
  if (metrics.baselineStress !== null) parts.push(`- Stress baseline: ${metrics.baselineStress}/5`);
  if (metrics.baselineAnxiety !== null) parts.push(`- Anxiety baseline: ${metrics.baselineAnxiety}/5`);

  if (metrics.trends && Array.isArray(metrics.trends)) {
    parts.push("");
    parts.push("Trend directions:");
    metrics.trends.forEach((t) => {
      parts.push(`- ${t.label}: ${t.direction} (${t.strength} change)`);
    });
  }

  if (metrics.recentNotes && metrics.recentNotes.length > 0) {
    parts.push("");
    parts.push("Recent student notes (from check-ins): ");
    metrics.recentNotes.forEach((note, i) => {
      parts.push(`  ${i + 1}. "${note}"`);
    });
  }

  parts.push("");
  parts.push("Provide a calm, supportive insight based on these patterns. Do not diagnose. Do not repeat the raw data.");

  return parts.join("\n");
}

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(`MindSync AI server running at http://localhost:${PORT}`);
});
