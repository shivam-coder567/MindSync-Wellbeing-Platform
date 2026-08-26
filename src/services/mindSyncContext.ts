/**
 * mindSyncContext.ts
 *
 * Builds a MindSyncContext object from existing wellness data.
 * This context is sent to the Groq backend so the AI can reference
 * the student's wellbeing patterns naturally in conversation.
 */

import type { ChatMessage } from "./aiService";
import { getWellnessRecords } from "./wellnessService";
import {
  computeBaseline,
  computeWellnessSnapshot,
} from "./wellnessAnalytics";

export type MindSyncContext = {
  recentMood: number | null;
  recentStress: number | null;
  recentAnxiety: number | null;

  moodTrend: "improving" | "declining" | "stable";
  stressTrend: "improving" | "declining" | "stable";
  anxietyTrend: "improving" | "declining" | "stable";

  recentNotes: string[];

  recentConversationMessages: {
    sender: "student" | "mindSync";
    text: string;
  }[];

  conversationTitle?: string;

  recentActivities?: string[];
};

/**
 * Map wellnessAnalytics trend direction to the simpler
 * context format.
 */
function mapDirection(
  dir: string | undefined,
): "improving" | "declining" | "stable" {
  if (dir === "improving") return "improving";
  if (dir === "declining") return "declining";
  return "stable";
}

/**
 * Build the MindSyncContext for the currently authenticated student.
 *
 * This runs client-side using existing Supabase queries and
 * the wellness analytics engine. No sensitive data leaves
 * the browser — only the structured context object is sent
 * to the Groq backend.
 */
export async function buildMindSyncContext(
  studentId: string,
  messages: ChatMessage[],
  conversationTitle?: string,
): Promise<MindSyncContext> {
  const emptyContext: MindSyncContext = {
    recentMood: null,
    recentStress: null,
    recentAnxiety: null,
    moodTrend: "stable",
    stressTrend: "stable",
    anxietyTrend: "stable",
    recentNotes: [],
    recentConversationMessages: [],
    conversationTitle,
  };

  try {
    const records = await getWellnessRecords(studentId);

    if (records.length === 0) {
      return {
        ...emptyContext,
        recentConversationMessages: messages
          .filter(
            (m) =>
              !(m.sender === "mindSync" && m.text.startsWith("Hi, I'm here")),
          )
          .slice(-15),
      };
    }

    const snapshot = computeWellnessSnapshot(records);

    const moodTrend = snapshot.trends.find((t) => t.label === "Mood");
    const stressTrend = snapshot.trends.find((t) => t.label === "Stress");
    const anxietyTrend = snapshot.trends.find((t) => t.label === "Anxiety");

    /* Filter out the initial welcome message from context */
    const contextMessages = messages
      .filter(
        (m) =>
          !(m.sender === "mindSync" && m.text.startsWith("Hi, I'm here")),
      )
      .slice(-15);

    return {
      recentMood:
        snapshot.recent7.length > 0
          ? snapshot.recent7.reduce((s, r) => s + r.mood, 0) /
            snapshot.recent7.length
          : null,
      recentStress:
        snapshot.recent7.length > 0
          ? snapshot.recent7.reduce((s, r) => s + r.stressLevel, 0) /
            snapshot.recent7.length
          : null,
      recentAnxiety:
        snapshot.recent7.length > 0
          ? snapshot.recent7.reduce((s, r) => s + r.anxietyLevel, 0) /
            snapshot.recent7.length
          : null,

      moodTrend: mapDirection(moodTrend?.direction),
      stressTrend: mapDirection(stressTrend?.direction),
      anxietyTrend: mapDirection(anxietyTrend?.direction),

      recentNotes: snapshot.recentNotes,

      recentConversationMessages: contextMessages,

      conversationTitle,
    };
  } catch (error) {
    console.error("Could not build wellness context:", error);
    return {
      ...emptyContext,
      recentConversationMessages: messages
        .filter(
          (m) =>
            !(m.sender === "mindSync" && m.text.startsWith("Hi, I'm here")),
        )
        .slice(-15),
    };
  }
}
