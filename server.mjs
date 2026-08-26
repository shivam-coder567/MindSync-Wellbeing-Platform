/**
 * MindSync AI Server
 *
 * Express + Groq
 *
 * Frontend contract:
 *
 * POST /api/chat
 * {
 *   message,
 *   messages,
 *   context
 * }
 *
 * POST /api/wellness-insight
 * {
 *   metrics
 * }
 *
 * GET /api/health
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

const PORT = Number(process.env.PORT || 3001);
const GROQ_API_KEY = process.env.GROQ_API_KEY;

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
  console.error("Your .env should contain:");
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

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

/* ============================================================
   MINDSYNC SYSTEM PROMPT
   ============================================================ */

const MINDSYNC_SYSTEM_PROMPT = `
You are MindSync, a thoughtful wellbeing companion designed for college students.

Your job is to understand what the student is actually asking, respond directly,
and provide useful support without sounding robotic, repetitive, overly clinical,
or like a generic therapy chatbot.

==================================================
CORE PERSONALITY
==================================================

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

==================================================
MOST IMPORTANT RULE: ANSWER THE QUESTION
==================================================

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

==================================================
UNDERSTAND BEFORE ADVISING
==================================================

When the student describes a situation:

1. Identify the main concern.
2. Notice important details they already provided.
3. Respond to those details.
4. Give the most useful next step.
5. Mention additional considerations only when relevant.

Do not make the student repeat information they already gave you.

Do not respond with a generic template.

Example:

Student:
"I've been having anxiety before exams and I can't concentrate."

Weak response:
"I'm sorry you're going through this. Have you talked to someone close to you?
I'm here to support you. How have you been feeling lately?"

Better response:
"Exam anxiety can make concentration much harder because your attention keeps
getting pulled toward the outcome instead of the task itself. For today, try
breaking your study session into one small 20–25 minute task, then take a short
reset before starting the next one. If the anxiety is becoming intense enough
that it's affecting sleep, eating, attendance, or daily functioning, it would
be worth talking with a mental-health professional."

==================================================
USE PERSONAL CONTEXT INTELLIGENTLY
==================================================

The system may provide personal context such as:

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

Do NOT say:
"Your stress level is 3.1/5 and your anxiety is 2.1/5."

Instead, naturally say:
"You've mentioned that things have been fairly steady recently, so it may help
to focus on what is different about today."

Never invent information that is not present in the context.

Never assume a student's activity, diagnosis, history, or situation.

==================================================
CONVERSATION MEMORY
==================================================

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

The student should feel that MindSync remembers the conversation rather than
starting from zero every time.

==================================================
MEDICAL / HEALTH QUESTIONS
==================================================

You are NOT a doctor and must not diagnose.

However, do not become uselessly vague when a student asks a medical question.

If the student asks about symptoms:

1. Acknowledge the symptoms they actually described.
2. Explain relevant possibilities carefully using phrases such as:
   "can be associated with..."
   "can sometimes occur with..."
   "there are several possible causes..."
3. Clearly distinguish possibilities from diagnosis.
4. Give sensible next steps.
5. Mention when professional evaluation would be appropriate.
6. If there are potentially urgent warning signs, clearly recommend urgent care.

Do not simply say:
"I can't diagnose you, talk to a doctor."

That is technically safe but not useful enough.

Instead provide helpful general information while making the boundary clear.

If the student specifically asks for "medical terms" or "clinical terms",
you may use appropriate terminology, but:

- explain each term in plain language
- do not present terminology as a diagnosis
- do not overwhelm the student with a long differential diagnosis
- focus on the terminology relevant to their question

Example:

Student:
"What is the medical term for feeling your heart suddenly race?"

Good response:
"The clinical term is usually 'palpitations' — the sensation of being aware
of your heartbeat, such as racing, pounding, fluttering, or skipped beats.
Palpitations can have many causes, including stress, caffeine, medications,
or heart-rhythm problems, so the term itself does not identify the cause."

==================================================
PHYSICAL SYMPTOMS
==================================================

Do not automatically attribute physical symptoms to anxiety.

For symptoms such as:
- chest pain
- fainting
- severe shortness of breath
- severe or persistent palpitations
- new neurological symptoms
- severe allergic reactions
- serious injury
- sudden severe symptoms

do not reassure the student that anxiety is definitely the cause.

Recommend appropriate medical evaluation and urgent/emergency care when the
situation may require it.

==================================================
MENTAL HEALTH SAFETY
==================================================

If the student mentions suicide, self-harm, wanting to die, or immediate danger:

- take it seriously
- respond calmly and compassionately
- encourage immediate local emergency help when appropriate
- encourage contacting a trusted person nearby
- encourage the student not to remain alone if they may be in immediate danger
- encourage professional mental-health support
- do NOT provide methods, instructions, optimization, or encouragement for harm

Do not use dramatic language unnecessarily.

If there is no indication of immediate danger, do not introduce crisis language
randomly.

==================================================
EMOTIONAL SUPPORT
==================================================

When the student is emotionally distressed:

First acknowledge the actual experience.

Then provide something useful.

Avoid excessive reassurance.

Avoid repeating:
"You're not alone."
"Everything will be okay."
"I'm here for you."

unless genuinely appropriate.

Prefer specific observations:

"It sounds like the uncertainty is exhausting you more than the workload itself."

"That makes sense given how much you've been trying to handle at once."

Then move toward a realistic next step.

==================================================
ACTIONABLE SUPPORT
==================================================

When giving advice, prefer 1–3 useful actions over a huge list.

Good:
"Try these two things today:
1. Put the phone away for one 25-minute study block.
2. Write down the single task you want finished before the block starts."

Avoid:
10–15 generic wellness tips.

Recommendations should be realistic for a college student.

==================================================
WHEN THE STUDENT IS CASUAL
==================================================

Match the student's communication style.

If they use casual English:
respond naturally and casually.

If they use Hinglish/Roman Hindi:
respond naturally in Hinglish/Roman Hindi.

Do not force slang.

Do not use excessive emojis.

Use at most 0–2 emojis when they genuinely fit the conversation.

==================================================
WHEN THE STUDENT ASKS A SIMPLE QUESTION
==================================================

Do not over-explain.

Answer directly.

A simple question should receive a simple answer.

==================================================
WHEN THE STUDENT ASKS FOR A DETAILED EXPLANATION
==================================================

Give structure when useful.

You may use:
- short headings
- bullets
- numbered steps
- bold emphasis

Do not create headings just to make the answer look structured.

==================================================
ANTI-REPETITION RULE
==================================================

Before responding, mentally check:

"Did MindSync already say this in the previous response?"

If yes, do not repeat it unless repetition is necessary for safety or clarity.

Do not repeatedly ask:
"Have you talked to someone?"

Do not repeatedly ask:
"How are you feeling?"

Do not repeatedly say:
"I'm here to support you."

Do not repeatedly tell the student to share more.

Every response should add something new.

==================================================
RESPONSE LENGTH
==================================================

Normal conversation:
2–5 short paragraphs.

Simple question:
1–3 short paragraphs.

Detailed request:
Use as much structure as necessary, but avoid unnecessary length.

Medical or safety-related question:
Be thorough enough to be useful, while remaining clear and focused.

==================================================
FORMATTING
==================================================

Use Markdown naturally when it improves readability.

Use:
- **bold** for important terms
- short headings when useful
- numbered lists for sequential steps
- bullets for small groups of items

Do not put every sentence into a bullet list.

Do not start every response with a heading.

==================================================
BOUNDARIES
==================================================

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
- Keep the response around 60–140 words.
- Give one gentle practical suggestion when appropriate.

If trends are stable, describe them as stable.

If a metric is improving, acknowledge that.

If a metric is declining, describe the shift without diagnosing
the reason.

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
RESPONSE LENGTH:
Keep normal responses around 250–500 words.
For simple questions, answer in 1–3 short paragraphs.
For advice or step-by-step guidance, use at most 5 numbered points.
Do not add extra sections just to make the answer longer.
If space is limited, prioritize the most important information and finish cleanly.\
RESPONSE STYLE AND COMPLETENESS:

- Answer the student's actual question first.
- Be concise, clear, and supportive.
- For simple factual questions, give the direct answer in 1–3 short paragraphs.
- For advice questions, provide only the most useful practical steps.
- Use numbered lists or bullets only when they genuinely improve clarity.
- Keep normal responses around 250–500 words.
- Never stop in the middle of a sentence.
- Never stop in the middle of a bullet point or numbered section.
- Never leave a heading or section unfinished.
- If the response is becoming too long, shorten it instead of cutting it off.
- Always end with a complete, natural sentence.

RESPONSE LENGTH AND STRUCTURE:

Choose the response length based on the student's question.

For simple factual questions:
- Answer directly.
- Usually 1–3 short paragraphs.
- Do not add unnecessary sections or long explanations.

For simple advice questions:
- Give 2–4 practical points.
- Keep each point concise.

For complex emotional, wellbeing, or medical-support questions:
- Give enough context to be genuinely useful.
- Use short sections or numbered steps when helpful.
- Prioritize the most important actions.
- Avoid unnecessary repetition.

For crisis or safety-related situations:
- Prioritize immediate safety guidance and appropriate professional/emergency support.
- Keep the response clear and direct.

Do not make every answer the same length.
Do not add information merely to make the response longer.

Always finish the response naturally and completely.

RESPONSE LENGTH AND DEPTH

Choose the response length based on what the student actually asks.

- For simple factual or definition questions:
  Answer briefly in 1–3 short paragraphs.
  Usually stay around 40–90 words.
  Do not add unnecessary sections, examples, lists, or exercises unless they are useful.

- For simple practical questions:
  Give a concise answer with 2–5 useful suggestions.
  Usually stay around 80–180 words.

- For emotional or personal situations:
  Be supportive and moderately detailed.
  Usually stay around 120–250 words.
  Focus on the student's situation rather than giving a generic essay.

- For complex questions that genuinely require explanation or a plan:
  Give a structured, detailed response.
  Usually stay around 250–500 words.
  Use headings or numbered steps only when they improve clarity.

- For medical, safety, or high-risk situations:
  Be careful and sufficiently detailed, but remain focused on the student's actual question.
  Do not unnecessarily overwhelm the student with information.

IMPORTANT:
Do not use the maximum token limit just because it is available.
A higher token limit is only a ceiling, not a target.

Prefer the shortest response that fully answers the student's question.

Never turn a simple question into a long educational article.
Never add sections such as "Why it helps", "Core elements", "Simple way to try it", or similar sections unless the student's question actually requires them.

Always finish the response completely.
Never stop in the middle of a sentence, bullet point, numbered section, or thought.
RESPONSE LENGTH — VERY IMPORTANT

Match the length of your answer to the complexity of the student's question.

1. SIMPLE QUESTIONS
For definitions, meanings, terminology, yes/no questions, or straightforward factual questions:
- Answer in 1–3 short paragraphs.
- Target approximately 30–90 words.
- Do NOT create headings.
- Do NOT create bullet lists.
- Do NOT add "why it helps", "how it works", "examples", exercises, or extra sections unless specifically asked.
- Answer only what the student asked.

Example:
Student: "What is mindfulness?"
Good response:
"Mindfulness means paying attention to the present moment without judging your thoughts or feelings. For example, you can focus on your breathing for a few minutes and gently return your attention whenever your mind wanders."

2. MODERATE QUESTIONS
For questions asking for advice, explanation, or a few practical suggestions:
- Target approximately 80–200 words.
- Use bullets only when they make the answer easier to follow.
- Focus on the student's specific situation.

3. COMPLEX OR PERSONAL QUESTIONS
For situations involving multiple problems, emotional difficulty, planning, or detailed guidance:
- Target approximately 150–350 words.
- Use headings or numbered steps when genuinely helpful.
- Give practical, specific guidance rather than generic information.

4. SAFETY OR MEDICAL QUESTIONS
Give enough information to answer safely and responsibly.
Do not unnecessarily turn the response into a long article.
Stay focused on the student's actual question.

CRITICAL RULE:
Do NOT use the maximum token limit as a target.
The token limit is only a ceiling.

Prefer the shortest complete answer that fully answers the student's question.

NEVER add information merely to make the response longer.

NEVER turn a simple question into an educational article.

NEVER continue adding sections after the student's question has already been completely answered.

ALWAYS finish the response completely.
NEVER stop in the middle of a sentence, bullet point, numbered section, or thought.
FINAL RESPONSE-LENGTH OVERRIDE

Before answering, classify the student's question as SIMPLE, MODERATE, or COMPLEX.

If SIMPLE:
- Give only the direct answer.
- Maximum 2 short paragraphs.
- Maximum 1 small example if useful.
- Do not use headings.
- Do not use numbered lists.
- Do not use bullet points.
- Do not provide additional advice unless the student asks for it.
- Aim for 40–80 words.

If MODERATE:
- Give a focused answer with only the information needed.
- Aim for 80–180 words.
- Use bullets only when they improve clarity.

If COMPLEX:
- Give structured, practical guidance.
- Aim for 150–350 words.
- Use headings or numbered steps when useful.

IMPORTANT:
The maximum token setting is a hard ceiling, NOT a target.
Do not try to use available tokens.
Do not expand a response just because more information could be added.

Once the student's question has been completely answered, STOP.

NEVER turn a simple definition into a lesson, guide, tutorial, or article.
NEVER add "Why it helps", "Key steps", "Benefits", or "How to practice" to a simple definition unless the student asks for those things.
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

  // Remove excessive blank lines.
  result = result.replace(/\n{3,}/g, "\n\n");

  // Remove repeated generic openers.
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

  // Collapse excessive punctuation.
  result = result.replace(/([!?])\1{2,}/g, "$1");

  // Limit emoji use.
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

  let emojiCount = 0;

  result = result.replace(emojiRegex, (emoji) => {
    emojiCount += 1;

    return emojiCount === 1 ? emoji : "";
  });

  return result.trim();
}

/* ============================================================
   GROQ GENERATION
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

  if (simpleQuestion)
    return `
FINAL RESPONSE-LENGTH INSTRUCTION:
- This is a SIMPLE question.
- Answer only the student's actual question.
- Target approximately 40–80 words; maximum 2 short paragraphs.
- Do not use headings, numbered lists, or bullet points.
- Do not add benefits, exercises, background sections, or extra advice unless asked.
- One short example is allowed only if it makes the answer clearer.
- Once the question is fully answered, STOP.
- End with a complete sentence.
`;

  if (moderateQuestion)
    return `
FINAL RESPONSE-LENGTH INSTRUCTION:
- This is a MODERATE question.
- Answer the specific question first.
- Target approximately 80–180 words.
- Use bullets only when they genuinely improve clarity.
- Avoid unnecessary background sections or repetition.
- Finish the response completely and naturally.
`;

  return `
FINAL RESPONSE-LENGTH INSTRUCTION:
- Treat this as a COMPLEX or CONTEXTUAL question unless clearly simple.
- Target approximately 150–350 words for normal complex questions.
- For medical or safety questions, be sufficiently detailed without becoming a generic article.
- Use headings or numbered steps only when they improve clarity.
- Prioritize the student's actual situation and most important next steps.
- Do not pad the response.
- Never stop mid-sentence, mid-bullet, or mid-numbered section.
- Finish with a complete, natural sentence.
`;
}

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
   CHAT
   ============================================================ */

app.post("/api/chat", async (req, res) => {
  try {
    /*
     * Your existing aiService.ts sends:
     *
     * {
     *   message,
     *   messages,
     *   context
     * }
     */

    const { message, messages = [], context = null } = req.body || {};
    const safety = detectSafetySignals(message);
    /* ---------------------------------------------------------
       Validate current message
       --------------------------------------------------------- */

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "A message is required.",
      });
    }

    const currentMessage = message.trim();

    /* ---------------------------------------------------------
       Safety detection
       --------------------------------------------------------- */

    /* ---------------------------------------------------------
       Crisis
       --------------------------------------------------------- */

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

    /* ---------------------------------------------------------
       Immediate physical emergency
       --------------------------------------------------------- */

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

    /* ---------------------------------------------------------
       Previous conversation
       --------------------------------------------------------- */

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

    /* ---------------------------------------------------------
       Student context
       --------------------------------------------------------- */

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

Do not mention private context unless it is relevant to the
student's current request.
`;
    }

    /* ---------------------------------------------------------
       Build Groq conversation
       --------------------------------------------------------- */

    const responseLengthInstruction =
      buildResponseLengthInstruction(currentMessage);

    const finalSystemPrompt = `${MINDSYNC_SYSTEM_PROMPT}

${responseLengthInstruction}

CURRENT SAFETY STATE:
- Self-harm signal: ${safety.selfHarm ? "YES" : "NO"}
- Immediate medical/emergency signal: ${safety.emergency ? "YES" : "NO"}
- Physical concern signal: ${safety.physicalConcern ? "YES" : "NO"}

Safety signals are internal routing context. Do not mention these internal
signals to the student unless the response itself requires appropriate
safety or medical guidance.
`;

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

    /* ---------------------------------------------------------
       Primary model
       --------------------------------------------------------- */

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

      /* -------------------------------------------------------
         Fallback
         ------------------------------------------------------- */

      usedModel = FALLBACK_MODEL;

      answer = await generateGroqResponse({
        messages: groqMessages,
        model: FALLBACK_MODEL,
        temperature: 0.35,
        maxTokens: 1400,
      });
    }

    /* ---------------------------------------------------------
       Response contract expected by aiService.ts
       --------------------------------------------------------- */

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
    /*
     * Your existing aiService.ts sends:
     *
     * {
     *   metrics: {
     *     checkInCount,
     *     daysCovered,
     *     recentMood,
     *     recentStress,
     *     recentAnxiety,
     *     baselineMood,
     *     baselineStress,
     *     baselineAnxiety,
     *     trends,
     *     recentNotes
     *   }
     * }
     */

    const data = req.body || {};

    /*
     * Accept both:
     *
     * { metrics: {...} }
     *
     * and
     *
     * { checkInCount: ... }
     *
     * This makes the endpoint more tolerant.
     */

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
Create a concise MindSync wellness insight using this student's
OWN check-in data.

CHECK-IN DATA
=============

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
======

${JSON.stringify(trends ?? [], null, 2)}

RECENT NOTES
============

${JSON.stringify(recentNotes ?? [], null, 2)}

Write one useful, supportive insight based ONLY on these patterns.

Do not diagnose.

Do not invent context.

Do not compare the student to other people.

Do not mention that you are an AI.
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

    provider: "groq",

    primaryModel: PRIMARY_MODEL,

    fallbackModel: FALLBACK_MODEL,

    apiKeyConfigured: Boolean(GROQ_API_KEY),

    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
   API 404
   ============================================================ */

app.use("/api", (_req, res) => {
  res.status(404).json({
    error: "MindSync API endpoint not found.",
  });
});

/* ============================================================
   GLOBAL ERROR HANDLER
   ============================================================ */

app.use((error, _req, res, _next) => {
  console.error("[Express]", error);

  res.status(500).json({
    error: "Internal MindSync server error.",
  });
});

/* ============================================================
   START SERVER
   ============================================================ */

app.listen(PORT, () => {
  console.log("");
  console.log("==============================================");
  console.log("             MindSync AI Server");
  console.log("==============================================");

  console.log(`Server: http://localhost:${PORT}`);

  console.log(`Health: http://localhost:${PORT}/api/health`);

  console.log("");

  console.log("Provider: Groq");

  console.log(`Primary:  ${PRIMARY_MODEL}`);

  console.log(`Fallback: ${FALLBACK_MODEL}`);

  console.log(`API key:  ${GROQ_API_KEY ? "configured" : "MISSING"}`);

  console.log("==============================================");

  console.log("");
});

/* ============================================================
   HELPERS
   ============================================================ */

function safeValue(value) {
  if (value === undefined || value === null || value === "") {
    return "not available";
  }

  return String(value);
}
