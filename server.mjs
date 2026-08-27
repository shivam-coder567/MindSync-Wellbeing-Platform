/**
 * MindSync AI Server
 *
 * Express + Groq
 *
 * Production-ready configuration:
 * - CORS for local + production frontend
 * - Environment variables
 * - Groq primary + fallback model
 * - Health check
 * - Chat API
 * - Wellness insight API
 * - AI benchmark API
 * - Production-safe error handling
 */

import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import Groq from "groq-sdk";

/* ============================================================
   ENVIRONMENT
   ============================================================ */

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();

    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

/* ============================================================
   CONFIGURATION
   ============================================================ */

const PORT = Number(process.env.PORT || 3001);

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const NODE_ENV = process.env.NODE_ENV || "development";

/*
 * FRONTEND_URL can contain one production URL.
 *
 * Example:
 *
 * FRONTEND_URL=https://mindsync.example.com
 *
 * FRONTEND_URLS can optionally contain multiple URLs:
 *
 * FRONTEND_URLS=https://mindsync.example.com,https://www.mindsync.example.com
 */

const frontendUrls = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(",") : []),
]
  .filter(Boolean)
  .map((url) => url.trim().replace(/\/$/, ""));

/* ============================================================
   GROQ
   ============================================================ */

const groq = GROQ_API_KEY
  ? new Groq({
      apiKey: GROQ_API_KEY,
    })
  : null;

const PRIMARY_MODEL = "openai/gpt-oss-120b";

const FALLBACK_MODEL = "llama-3.3-70b-versatile";

if (!GROQ_API_KEY) {
  console.error("");
  console.error("=================================================");
  console.error("MindSync AI ERROR");
  console.error("=================================================");
  console.error("GROQ_API_KEY is missing.");
  console.error("");
  console.error("Add this to your local .env:");
  console.error("");
  console.error("GROQ_API_KEY=gsk_your_key_here");
  console.error("");
  console.error("Then restart the server.");
  console.error("=================================================");
  console.error("");
}

/* ============================================================
   EXPRESS
   ============================================================ */

const app = express();

/*
 * Required when deployed behind a reverse proxy such as Render.
 */
app.set("trust proxy", 1);

/*
 * CORS
 */

app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * Requests without Origin:
       * - health checks
       * - server-to-server requests
       * - curl
       */

      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (frontendUrls.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);

      return callback(new Error("CORS: Origin not allowed."));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "x-client-info",
    ],
  }),
);

/*
 * JSON body parser.
 */
app.use(
  express.json({
    limit: "1mb",
  }),
);

/*
 * Basic request logging in development.
 */
if (NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

    next();
  });
}

/* ============================================================
   MINDSYNC SYSTEM PROMPT
   ============================================================ */

const MINDSYNC_SYSTEM_PROMPT = `
You are MindSync, a thoughtful wellbeing companion designed for college students.

Your job is to understand what the student is actually asking, respond directly,
and provide useful support without sounding robotic, repetitive, overly clinical,
or like a generic therapy chatbot.

CORE PERSONALITY

Be:

- warm
- calm
- intelligent
- emotionally aware
- practical
- respectful
- conversational
- non-judgmental

Sound like a thoughtful human companion, not a scripted support bot.

Do NOT repeatedly say:

- "I'm here to support you."
- "Feel free to share more."
- "Have you talked to someone?"
- "It's okay to feel this way."
- "Let's talk about it."
- "I'm here for you."

These phrases may be appropriate occasionally, but NEVER use them as filler
or repeat them across consecutive responses.

MOST IMPORTANT RULE: ANSWER THE QUESTION

Before responding, determine what the student is actually asking.

If they ask for:

- advice → give practical advice
- an explanation → explain it clearly
- medical terminology → explain the relevant terminology
- next steps → give concrete next steps
- emotional support → respond emotionally first
- a decision → help them compare options
- a study/productivity problem → give useful practical strategies
- a casual question → answer naturally and briefly

Do not turn every conversation into a mental-health check-in.

Do not ask a question simply because you are supposed to ask one.

Only ask a follow-up question when the answer genuinely depends on missing
information or when one focused question would meaningfully help.

Maximum: ONE useful question at the end.

UNDERSTAND BEFORE ADVISING

When the student describes a situation:

1. Identify the main concern.
2. Notice important details they already provided.
3. Respond to those details.
4. Give the most useful next step.
5. Mention additional considerations only when relevant.

Do not make the student repeat information they already gave you.

Do not respond with a generic template.

USE PERSONAL CONTEXT INTELLIGENTLY

The system may provide:

- recent mood
- recent stress
- recent anxiety
- trends
- check-in notes
- recent activities
- conversation title
- recent conversation messages

Use this context when it genuinely helps answer the student's current message.

Do NOT dump the data back to the student.

Never invent information that is not present in the context.

Never assume a student's activity, diagnosis, history, or situation.

CONVERSATION MEMORY

Pay attention to previous messages.

If the student already explained:

- their symptoms
- their situation
- their name
- what they tried
- what they are worried about

do not ask for the same information again unless clarification is genuinely
necessary.

Build on the conversation.

MEDICAL / HEALTH QUESTIONS

You are NOT a doctor and must not diagnose.

However, do not become uselessly vague when a student asks a medical question.

If the student asks about symptoms:

1. Acknowledge the symptoms they actually described.
2. Explain relevant possibilities carefully.
3. Clearly distinguish possibilities from diagnosis.
4. Give sensible next steps.
5. Mention when professional evaluation would be appropriate.
6. If there are potentially urgent warning signs, clearly recommend urgent care.

Do not simply say:
"I can't diagnose you, talk to a doctor."

Instead provide helpful general information while making the boundary clear.

If the student asks for medical terms, explain the terminology in plain language
and do not present terminology as a diagnosis.

PHYSICAL SYMPTOMS

Do not automatically attribute physical symptoms to anxiety.

For:

- chest pain
- fainting
- severe shortness of breath
- severe or persistent palpitations
- new neurological symptoms
- severe allergic reactions
- serious injury
- sudden severe symptoms

do not reassure the student that anxiety is definitely the cause.

Recommend appropriate medical evaluation.

MENTAL HEALTH SAFETY

If the student mentions suicide, self-harm, wanting to die, or immediate danger:

- take it seriously
- respond calmly and compassionately
- encourage immediate local emergency help when appropriate
- encourage contacting a trusted person nearby
- encourage the student not to remain alone if they may be in immediate danger
- encourage professional mental-health support
- do NOT provide methods, instructions, optimization, or encouragement for harm

EMOTIONAL SUPPORT

When the student is emotionally distressed:

First acknowledge the actual experience.

Then provide something useful.

Avoid excessive reassurance.

ACTIONABLE SUPPORT

When giving advice, prefer 1–3 useful actions over a huge list.

Recommendations should be realistic for a college student.

WHEN THE STUDENT IS CASUAL

Match the student's communication style.

If they use casual English:
respond naturally and casually.

If they use Hinglish/Roman Hindi:
respond naturally in Hinglish/Roman Hindi.

Do not force slang.

Do not use excessive emojis.

Use at most 0–2 emojis when they genuinely fit.

WHEN THE STUDENT ASKS A SIMPLE QUESTION

Do not over-explain.

Answer directly.

A simple question should receive a simple answer.

WHEN THE STUDENT ASKS FOR A DETAILED EXPLANATION

Give structure when useful.

Use:

- short headings
- bullets
- numbered steps
- bold emphasis

only when they improve readability.

ANTI-REPETITION RULE

Before responding, mentally check:

"Did MindSync already say this in the previous response?"

If yes, do not repeat it unless necessary for safety or clarity.

RESPONSE LENGTH

Simple question:
approximately 40–80 words.

Moderate question:
approximately 80–180 words.

Complex question:
approximately 150–350 words.

Medical or safety question:
be sufficiently detailed while remaining focused.

Never use maximum tokens as a target.

Always finish naturally.

BOUNDARIES

You are:

- a wellbeing companion
- a conversational support tool
- an informational assistant

You are NOT:

- a doctor
- a psychiatrist
- a therapist
- an emergency service
- a diagnostic system

Never claim certainty about a diagnosis or medical condition.

Never shame, judge, mock, or dismiss the student.

Never invent personal information.

Never pretend to have performed an action that you did not perform.

Most importantly:

LISTEN TO WHAT THE STUDENT ACTUALLY SAID.
ANSWER WHAT THEY ACTUALLY ASKED.
USE THEIR CONTEXT WHEN IT HELPS.
DO NOT FALL BACK TO GENERIC SUPPORT PHRASES.
MAKE EVERY RESPONSE USEFUL.
`;

/* ============================================================
   WELLNESS INSIGHT SYSTEM PROMPT
   ============================================================ */

const WELLNESS_SYSTEM_PROMPT = `
You generate short wellbeing insights for MindSync.

The application provides the student's own check-in data.

Your job is to explain patterns clearly and carefully.

RULES:

- Use only the supplied data.
- Do not invent information.
- Do not diagnose.
- Do not compare the student with other people.
- Do not claim certainty about why a pattern exists.
- Do not overreact to small changes.
- Do not make the student feel judged.
- Do not repeat raw numbers excessively.
- Do not use generic motivational filler.
- Avoid emojis.
- Keep the response concise.
- Give one gentle practical suggestion when appropriate.

If trends are stable, describe them as stable.

If a metric is improving, acknowledge that.

If a metric is declining, describe the shift without diagnosing the reason.

Use language such as:

"Your recent check-ins suggest..."

"This appears to be a small change..."

"It may be worth noticing..."

"A gentle next step could be..."

Avoid:

"This means you have..."

"You are suffering from..."

"Your condition is..."

"Your mental health is deteriorating..."

The goal is useful reflection, not diagnosis.

Always finish the response completely.
`;

/* ============================================================
   SAFETY DETECTION
   ============================================================ */

function detectSafetySignals(text = "") {
  const normalized = String(text).toLowerCase().replace(/\s+/g, " ").trim();

  const selfHarmPatterns = [
    /\bkill myself\b/,
    /\bkill me\b/,
    /\bend my life\b/,
    /\bwant to die\b/,
    /\bi want death\b/,
    /\bsuicidal\b/,
    /\bsuicide\b/,
    /\bhurt myself\b/,
    /\bharming myself\b/,
    /\bself[- ]harm\b/,
    /\bself[- ]harming\b/,
  ];

  const emergencyPatterns = [
    /\bchest pain\b/,
    /\bcan't breathe\b/,
    /\bcannot breathe\b/,
    /\bdifficulty breathing\b/,
    /\bshortness of breath\b/,
    /\bpassed out\b/,
    /\bfainted\b/,
    /\bfainting\b/,
    /\bsevere dizziness\b/,
  ];

  const cardiacPatterns = [
    /\bheart palpitations?\b/,
    /\bheart is racing\b/,
    /\bheart racing\b/,
    /\bracing heart\b/,
    /\bheart pounding\b/,
    /\birregular heartbeat\b/,
    /\bheart fluttering\b/,
    /\bheart flutter\b/,
  ];

  return {
    selfHarm: selfHarmPatterns.some((pattern) => pattern.test(normalized)),

    emergency: emergencyPatterns.some((pattern) => pattern.test(normalized)),

    physicalConcern: cardiacPatterns.some((pattern) =>
      pattern.test(normalized),
    ),
  };
}

/* ============================================================
   SAFETY RESPONSES
   ============================================================ */

function buildCrisisResponse() {
  return (
    "I'm really sorry you're dealing with this. Because you've " +
    "mentioned wanting to die or hurt yourself, this needs immediate " +
    "human support rather than an AI conversation.\n\n" +
    "If you might act on these thoughts or you're in immediate danger, " +
    "contact your local emergency service or crisis service now. " +
    "If possible, stay with someone you trust and move away from " +
    "anything you could use to hurt yourself.\n\n" +
    "If you can do so safely, tell someone you trust what is happening " +
    "right now and ask them to stay with you."
  );
}

function buildEmergencyResponse() {
  return (
    "Because you're describing symptoms that can sometimes require " +
    "urgent medical assessment, I wouldn't assume they're caused by " +
    "stress or anxiety.\n\n" +
    "If you're currently experiencing chest pain, significant " +
    "difficulty breathing, fainting, or severe dizziness, seek urgent " +
    "medical care now.\n\n" +
    "If those warning signs aren't happening, arrange an appointment " +
    "with a healthcare professional to discuss the symptoms and your " +
    "medical history."
  );
}

/* ============================================================
   RESPONSE CLEANING
   ============================================================ */

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanResponse(text) {
  if (!text) {
    return "";
  }

  let result = String(text).trim();

  result = result.replace(/\n{3,}/g, "\n\n");

  const repeatedOpeners = [
    "Hey there! MindSync here.",
    "Hey there! I'm here to support you.",
    "I'm here to listen and support you.",
    "I'm here for you.",
  ];

  for (const phrase of repeatedOpeners) {
    const regex = new RegExp(escapeRegExp(phrase), "gi");

    const matches = result.match(regex);

    if (matches && matches.length > 1) {
      let first = true;

      result = result.replace(regex, () => {
        if (first) {
          first = false;
          return phrase;
        }

        return "";
      });
    }
  }

  result = result.replace(/([!?])\1{2,}/g, "$1");

  /*
   * Keep emoji use low.
   */
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

  let emojiCount = 0;

  result = result.replace(emojiRegex, (emoji) => {
    emojiCount += 1;

    return emojiCount === 1 ? emoji : "";
  });

  return result.trim();
}

/* ============================================================
   RESPONSE LENGTH
   ============================================================ */

function buildResponseLengthInstruction(message = "") {
  const text = String(message).trim();

  const simpleQuestion =
    text.length <= 90 &&
    /^(what is|what are|define|meaning of|what does|what do you mean by|who is|who are|where is|when is|why is|is it|can you define)\b/i.test(
      text,
    );

  const moderateQuestion =
    text.length <= 220 &&
    /^(how can|how do|how should|what should|can you help|should i|what can i|why do|why does)\b/i.test(
      text,
    );

  if (simpleQuestion) {
    return `
FINAL RESPONSE-LENGTH INSTRUCTION:

- This is a SIMPLE question.
- Answer only the student's actual question.
- Target approximately 40–80 words.
- Maximum 2 short paragraphs.
- Do not use headings.
- Do not use numbered lists.
- Do not use bullet points.
- Do not add unnecessary advice.
- Finish with a complete sentence.
`;
  }

  if (moderateQuestion) {
    return `
FINAL RESPONSE-LENGTH INSTRUCTION:

- This is a MODERATE question.
- Answer the specific question first.
- Target approximately 80–180 words.
- Use bullets only when they genuinely improve clarity.
- Avoid unnecessary background.
- Finish completely.
`;
  }

  return `
FINAL RESPONSE-LENGTH INSTRUCTION:

- Treat this as a COMPLEX or CONTEXTUAL question.
- Target approximately 150–350 words.
- For medical or safety questions, be sufficiently detailed without becoming a generic article.
- Prioritize the student's actual situation.
- Do not pad the response.
- Never stop mid-sentence.
- Finish naturally.
`;
}

/* ============================================================
   GROQ GENERATION
   ============================================================ */

async function generateGroqResponse({
  messages,
  model = PRIMARY_MODEL,
  temperature = 0.4,
  maxTokens = 700,
}) {
  if (!groq) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const completion = await groq.chat.completions.create({
    model,

    messages,

    temperature,

    top_p: 0.9,

    max_completion_tokens: maxTokens,

    stream: false,
  });

  const content = completion?.choices?.[0]?.message?.content || "";

  if (!content.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return cleanResponse(content);
}

/* ============================================================
   CHAT API
   ============================================================ */

app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages = [], context = null } = req.body || {};

    /*
     * Validate message FIRST.
     */
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "A message is required.",
      });
    }

    const currentMessage = message.trim();

    /*
     * Safety detection.
     */
    const safety = detectSafetySignals(currentMessage);

    /*
     * Crisis.
     */
    if (safety.selfHarm) {
      const response = buildCrisisResponse();

      return res.json({
        response,
        message: response,
        text: response,
        provider: "mindsync-safety",
        model: "safety-policy",
        safety: true,
      });
    }

    /*
     * Physical emergency.
     */
    if (safety.emergency) {
      const response = buildEmergencyResponse();

      return res.json({
        response,
        message: response,
        text: response,
        provider: "mindsync-safety",
        model: "safety-policy",
        safety: true,
      });
    }

    /*
     * Previous conversation.
     */
    const conversationMessages = Array.isArray(messages)
      ? messages
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              typeof item.text === "string" &&
              item.text.trim(),
          )
          .map((item) => ({
            role: item.sender === "mindSync" ? "assistant" : "user",

            content: item.text.trim(),
          }))
      : [];

    /*
     * Student context.
     */
    let contextText = "";

    if (context && typeof context === "object") {
      const {
        recentMood,
        recentStress,
        recentAnxiety,
        moodTrend,
        stressTrend,
        anxietyTrend,
        recentNotes,
        recentConversationMessages,
        conversationTitle,
        recentActivities,
      } = context;

      contextText = `
STUDENT CONTEXT
===============

This is background information from MindSync.

Recent mood:
${safeValue(recentMood)}

Recent stress:
${safeValue(recentStress)}

Recent anxiety:
${safeValue(recentAnxiety)}

Mood trend:
${safeValue(moodTrend)}

Stress trend:
${safeValue(stressTrend)}

Anxiety trend:
${safeValue(anxietyTrend)}

Conversation title:
${safeValue(conversationTitle)}

Recent activities:
${JSON.stringify(recentActivities ?? [], null, 2)}

Recent wellbeing notes:
${JSON.stringify(recentNotes ?? [], null, 2)}

Additional recent conversation messages:
${JSON.stringify(recentConversationMessages ?? [], null, 2)}

IMPORTANT:

This is background context only.

Do not assume anything that is not explicitly present.

Do not diagnose the student.

Do not mention private context unless it is relevant to
the student's current request.
`;
    }

    /*
     * Response length.
     */
    const responseLengthInstruction =
      buildResponseLengthInstruction(currentMessage);

    /*
     * Final system prompt.
     */
    const finalSystemPrompt = `
${MINDSYNC_SYSTEM_PROMPT}

${responseLengthInstruction}

CURRENT SAFETY STATE:

- Self-harm signal: ${safety.selfHarm ? "YES" : "NO"}

- Immediate medical/emergency signal: ${safety.emergency ? "YES" : "NO"}

- Physical concern signal: ${safety.physicalConcern ? "YES" : "NO"}

Safety signals are internal routing context.
Do not mention these internal signals to the student.
`;

    /*
     * Groq messages.
     */
    const groqMessages = [
      {
        role: "system",
        content: finalSystemPrompt,
      },

      ...(contextText
        ? [
            {
              role: "system",
              content: contextText,
            },
          ]
        : []),

      ...conversationMessages,

      /*
       * Current message MUST be last.
       */
      {
        role: "user",
        content: currentMessage,
      },
    ];

    /*
     * Primary model.
     */
    let answer;

    let usedModel = PRIMARY_MODEL;

    try {
      answer = await generateGroqResponse({
        messages: groqMessages,
        model: PRIMARY_MODEL,
        temperature: 0.35,
        maxTokens: 1400,
      });
    } catch (primaryError) {
      console.error(
        "[Groq primary model failed]",
        primaryError?.message || primaryError,
      );

      /*
       * Fallback model.
       */
      usedModel = FALLBACK_MODEL;

      answer = await generateGroqResponse({
        messages: groqMessages,
        model: FALLBACK_MODEL,
        temperature: 0.35,
        maxTokens: 1400,
      });
    }

    /*
     * Response contract.
     */
    return res.json({
      response: answer,
      message: answer,
      text: answer,

      provider: "groq",
      model: usedModel,

      safety: false,

      physicalConcern: safety.physicalConcern,
    });
  } catch (error) {
    console.error("[/api/chat]", error?.message || error);

    return res.status(500).json({
      error: "MindSync AI could not generate a response.",

      response:
        "I'm having trouble connecting to the AI right now. Please try again in a moment.",
    });
  }
});

/* ============================================================
   WELLNESS INSIGHT
   ============================================================ */

app.post("/api/wellness-insight", async (req, res) => {
  try {
    const data = req.body || {};

    const metrics = data.metrics || data;

    const {
      checkInCount,
      daysCovered,
      recentMood,
      recentStress,
      recentAnxiety,
      baselineMood,
      baselineStress,
      baselineAnxiety,
      trends,
      recentNotes,
    } = metrics;

    const prompt = `
Create a concise MindSync wellness insight using this student's OWN check-in data.

CHECK-IN DATA

Check-ins:
${safeValue(checkInCount)}

Days covered:
${safeValue(daysCovered)}

Recent mood:
${safeValue(recentMood)}

Recent stress:
${safeValue(recentStress)}

Recent anxiety:
${safeValue(recentAnxiety)}

Personal baseline mood:
${safeValue(baselineMood)}

Personal baseline stress:
${safeValue(baselineStress)}

Personal baseline anxiety:
${safeValue(baselineAnxiety)}

TRENDS

${JSON.stringify(trends ?? [], null, 2)}

RECENT NOTES

${JSON.stringify(recentNotes ?? [], null, 2)}

Write one useful, supportive insight based ONLY on these patterns.

Do not diagnose.

Do not invent context.

Do not compare the student to other people.

Do not mention that you are an AI.

Keep it concise and useful.
`;

    const messages = [
      {
        role: "system",
        content: WELLNESS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    let answer;

    try {
      answer = await generateGroqResponse({
        messages,
        model: PRIMARY_MODEL,
        temperature: 0.3,
        maxTokens: 350,
      });
    } catch (primaryError) {
      console.error(
        "[Wellness primary model failed]",
        primaryError?.message || primaryError,
      );

      answer = await generateGroqResponse({
        messages,
        model: FALLBACK_MODEL,
        temperature: 0.3,
        maxTokens: 350,
      });
    }

    return res.json({
      insight: answer,
      response: answer,
      text: answer,
      message: answer,
      provider: "groq",
    });
  } catch (error) {
    console.error("[/api/wellness-insight]", error?.message || error);

    return res.status(500).json({
      error: "Could not generate wellness insight.",
    });
  }
});

/* ============================================================
   AI BENCHMARK
   ============================================================ */

app.post("/api/ai-benchmark", async (req, res) => {
  try {
    if (!groq) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing.",
      });
    }

    const prompt =
      typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

    if (!prompt) {
      return res.status(400).json({
        error: "A benchmark prompt is required.",
      });
    }

    const safety = detectSafetySignals(prompt);

    if (safety.selfHarm) {
      return res.json({
        safety: true,

        note: "Safety-sensitive prompts are handled by MindSync's safety layer.",

        results: [],
      });
    }

    const models = [PRIMARY_MODEL, FALLBACK_MODEL];

    const results = [];

    for (const model of models) {
      const started = Date.now();

      try {
        const response = await generateGroqResponse({
          messages: [
            {
              role: "system",
              content: MINDSYNC_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          model,

          temperature: 0.35,

          maxTokens: 700,
        });

        results.push({
          model,

          response,

          responseTimeMs: Date.now() - started,

          success: true,
        });
      } catch (error) {
        results.push({
          model,

          response: null,

          responseTimeMs: Date.now() - started,

          success: false,

          error: error?.message || "Unknown error",
        });
      }
    }

    return res.json({
      prompt,

      results,
    });
  } catch (error) {
    console.error("[/api/ai-benchmark]", error?.message || error);

    return res.status(500).json({
      error: "Benchmark failed.",
    });
  }
});

/* ============================================================
   HEALTH CHECK
   ============================================================ */

app.get("/api/health", (_req, res) => {
  return res.json({
    ok: true,

    service: "MindSync AI Server",

    environment: NODE_ENV,

    provider: "groq",

    primaryModel: PRIMARY_MODEL,

    fallbackModel: FALLBACK_MODEL,

    apiKeyConfigured: Boolean(GROQ_API_KEY),

    frontendConfigured: frontendUrls.length > 0,

    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   API 404
   ============================================================ */

app.use("/api", (_req, res) => {
  return res.status(404).json({
    error: "MindSync API endpoint not found.",
  });
});

/* ============================================================
   GLOBAL ERROR HANDLER
   ============================================================ */

app.use((error, _req, res, _next) => {
  console.error("[Express]", error?.message || error);

  /*
   * CORS errors should be returned as 403.
   */
  if (error?.message?.startsWith("CORS:")) {
    return res.status(403).json({
      error: "Request origin is not allowed.",
    });
  }

  return res.status(500).json({
    error: "Internal MindSync server error.",
  });
});

/* ============================================================
   START SERVER
   ============================================================ */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("==============================================");
  console.log("             MindSync AI Server");
  console.log("==============================================");

  console.log(`Environment: ${NODE_ENV}`);

  console.log(`Port: ${PORT}`);

  console.log(`Health: http://localhost:${PORT}/api/health`);

  console.log("");

  console.log("Provider: Groq");

  console.log(`Primary:  ${PRIMARY_MODEL}`);

  console.log(`Fallback: ${FALLBACK_MODEL}`);

  console.log(`API key:  ${GROQ_API_KEY ? "configured" : "MISSING"}`);

  console.log(
    `CORS origins: ${frontendUrls.length ? frontendUrls.join(", ") : "NONE"}`,
  );

  console.log("==============================================");

  console.log("");
});

/* ============================================================
   GRACEFUL SHUTDOWN
   ============================================================ */

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down MindSync server...`);

  server.close(() => {
    console.log("MindSync server stopped.");

    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown.");

    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("SIGINT", () => shutdown("SIGINT"));

/* ============================================================
   HELPERS
   ============================================================ */

function safeValue(value) {
  if (value === undefined || value === null || value === "") {
    return "not available";
  }

  return String(value);
}
