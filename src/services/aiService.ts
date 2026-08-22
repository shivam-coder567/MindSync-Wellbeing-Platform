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
