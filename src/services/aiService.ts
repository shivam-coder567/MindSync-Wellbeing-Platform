const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_URL environment configuration.");
}

export type ChatMessage = {
  sender: "student" | "mindSync";
  text: string;
};

export type MindSyncContextPayload = {
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

export type WellnessMetrics = {
  checkInCount: number;
  daysCovered: number;
  recentMood: number | null;
  recentStress: number | null;
  recentAnxiety: number | null;
  baselineMood: number | null;
  baselineStress: number | null;
  baselineAnxiety: number | null;
  trends: {
    label: string;
    direction: string;
    strength: string;
  }[];
  recentNotes: string[];
};

export async function getAIResponse(
  message: string,
  messages: ChatMessage[] = [],
  context?: MindSyncContextPayload,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      messages,
      context: context ?? null,
    }),
  });

  if (!response.ok) {
    let errorMessage = `AI server returned ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (!data?.response || typeof data.response !== "string") {
    throw new Error("AI server returned no response");
  }

  return data.response.trim();
}

export async function getWellnessInsight(
  metrics: WellnessMetrics,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/wellness-insight`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      metrics,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Wellness API returned ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (!data?.insight || typeof data.insight !== "string") {
    throw new Error("No insight returned");
  }

  return data.insight.trim();
}
