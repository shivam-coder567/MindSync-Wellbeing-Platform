import { Send, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  sender: "student" | "mindSync";
  text: string;
};

const initialMessage: ChatMessage = {
  sender: "mindSync",
  text: "Hi, I’m here to listen without judgment. What’s been on your mind today?",
};

export default function AICompanion() {
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);

  // Used to automatically scroll to the newest message.
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  async function handleSend() {
    const userMessage = message.trim();

    if (!userMessage || isThinking) {
      return;
    }

    const userChatMessage: ChatMessage = {
      sender: "student",
      text: userMessage,
    };

    const updatedMessages = [...messages, userChatMessage];

    setMessages(updatedMessages);
    setMessage("");
    setIsThinking(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "MindSync AI could not respond.");
      }

      const aiMessage: ChatMessage = {
        sender: "mindSync",
        text: data.response,
      };

      setMessages((currentMessages) => [...currentMessages, aiMessage]);
    } catch (error) {
      console.error("MindSync AI error:", error);

      const errorMessage: ChatMessage = {
        sender: "mindSync",
        text: "I’m having trouble connecting right now. Please try again in a moment.",
      };

      setMessages((currentMessages) => [...currentMessages, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">A private moment</p>

      <h1>Talk it through.</h1>

      <p className="lead">
        Share what you&apos;re feeling, at your own pace. MindSync is here to
        reflect and help you find your next small step.
      </p>

      <section className="two-column" style={{ marginTop: 30 }}>
        <div className="surface chat-panel">
          <div className="chat-header">
            <div>
              <h2 style={{ marginBottom: 3 }}>MindSync Companion</h2>

              <span className="online">
                ● {isThinking ? "Thinking..." : "Here with you"}
              </span>
            </div>

            <Sparkles color="#4b8e66" size={21} />
          </div>

          <div className="messages" aria-live="polite">
            {messages.map((item, index) => (
              <div
                className={`message ${item.sender === "student" ? "mine" : ""}`}
                key={`${item.sender}-${index}`}
              >
                <span className="message-label">
                  {item.sender === "student" ? "You" : "MindSync"}
                </span>

                {item.text}
              </div>
            ))}

            {isThinking && (
              <div className="message thinking-message">
                <span className="message-label">MindSync</span>

                <span className="typing-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          <div className="composer">
            <input
              aria-label="Your message"
              value={message}
              disabled={isThinking}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isThinking
                  ? "MindSync is thinking..."
                  : "What would you like to share?"
              }
            />

            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={isThinking || !message.trim()}
            >
              {isThinking ? "Thinking..." : "Send"}

              {!isThinking && <Send size={15} />}
            </button>
          </div>
        </div>

        <aside className="surface side-tip">
          <ShieldCheck size={24} color="#4d8f64" />

          <h3 style={{ marginTop: 16 }}>A supportive space</h3>

          <ul className="tip-list">
            <li>
              <span>•</span>
              You can write as much or as little as you want.
            </li>

            <li>
              <span>•</span>
              MindSync is a wellbeing companion, not a replacement for
              professional mental-health care.
            </li>

            <li>
              <span>•</span>
              If you are in immediate danger, please use the emergency support
              option.
            </li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
