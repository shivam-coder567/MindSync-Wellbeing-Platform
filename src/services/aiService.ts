export type ChatMessage = {
  sender: "student" | "mindSync";
  text: string;
};

export async function getAIResponse(
  message: string,
  messages: ChatMessage[] = [],
): Promise<string> {
  const response = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI server returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.response) {
    throw new Error("AI server returned no response");
  }

  return data.response;
}

/* ── Wellness insight ────────────────────────────────────────── */

export type WellnessMetrics = {
  checkInCount: number;
  daysCovered: number;
  recentMood: number | null;
  recentStress: number | null;
  recentAnxiety: number | null;
  baselineMood: number | null;
  baselineStress: number | null;
  baselineAnxiety: number | null;
  trends: { label: string; direction: string; strength: string }[];
  recentNotes: string[];
};

export async function getWellnessInsight(
  metrics: WellnessMetrics,
): Promise<string> {
  const response = await fetch("http://localhost:3001/api/wellness-insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metrics }),
  });

  if (!response.ok) {
    throw new Error(`Wellness API returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.insight) {
    throw new Error("No insight returned");
  }

  return data.insight;
}
