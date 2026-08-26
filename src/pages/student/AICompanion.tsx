import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRight,
  Clock3,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { getAIResponse } from "../../services/aiService";
import {
  createAIConversation,
  deleteAIConversation,
  getAIConversations,
  getAIMessages,
  saveAIMessage,
  touchAIConversation,
  updateAIConversation,
  type AIConversation,
  type AIHistoryMessage,
} from "../../services/aiHistoryService";
import { buildMindSyncContext } from "../../services/mindSyncContext";

type ChatMessage = {
  sender: "student" | "mindSync";
  text: string;
};

const INITIAL_MESSAGE: ChatMessage = {
  sender: "mindSync",
  text: "Hi, I'm here to listen without judgment. What's been on your mind today?",
};

const SUGGESTED_PROMPTS = [
  "I'm feeling stressed today",
  "I need help clearing my mind",
  "I want to talk about my studies",
];

function formatConversationDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return "Today";
  }

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMessageTime(dateString?: string) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function makeConversationTitle(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return "New conversation";
  }

  const lower = cleaned.toLowerCase();

  if (lower.includes("stress") || lower.includes("tension")) {
    return "Stress & tension";
  }

  if (lower.includes("exam")) {
    return "Exam worries";
  }

  if (lower.includes("sleep")) {
    return "Sleep concerns";
  }

  if (lower.includes("focus") || lower.includes("concentrate")) {
    return "Focus issues";
  }

  if (lower.includes("lonely") || lower.includes("alone")) {
    return "Feeling alone";
  }

  if (lower.includes("motivation") || lower.includes("motivated")) {
    return "Motivation check";
  }

  if (lower.includes("sad") || lower.includes("depressed")) {
    return "Feeling down";
  }

  if (lower.includes("angry") || lower.includes("frustrat")) {
    return "Frustration";
  }

  if (lower.includes("anxious") || lower.includes("anxiety")) {
    return "Anxiety check";
  }

  if (lower.includes("padhai") || lower.includes("padhna")) {
    return "Study concerns";
  }

  if (lower.includes("dimag") || lower.includes("dimaag")) {
    return "Clearing my mind";
  }

  if (lower.includes("confus")) {
    return "Confusion";
  }

  if (cleaned.length <= 35) {
    return cleaned;
  }

  return `${cleaned.slice(0, 35).trim()}…`;
}

function mapHistoryMessage(message: AIHistoryMessage): ChatMessage {
  return {
    sender: message.sender,
    text: message.text,
  };
}

export default function AICompanion() {
  const { profile } = useAuth();

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);

  const [messageTimestamps, setMessageTimestamps] = useState<
    Map<number, string>
  >(new Map());

  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  /*
   * Prevent old conversation requests from overwriting
   * a newer conversation selection.
   */
  const conversationRequestRef = useRef(0);

  /* ─────────────────────────────────────────────
     Load conversations
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (!profile?.id) {
      setIsHistoryLoading(false);
      return;
    }

    let active = true;

    async function loadHistory() {
      setIsHistoryLoading(true);
      setHistoryError("");

      try {
        const data = await getAIConversations();

        if (!active) return;

        setConversations(data);

        if (data.length > 0) {
          setActiveConversationId(data[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([INITIAL_MESSAGE]);
          setMessageTimestamps(new Map());
        }
      } catch (error) {
        console.error("Could not load AI history:", error);

        if (active) {
          setHistoryError(
            "Your conversation history couldn't be loaded right now.",
          );

          setConversations([]);
          setActiveConversationId(null);
          setMessages([INITIAL_MESSAGE]);
          setMessageTimestamps(new Map());
        }
      } finally {
        if (active) {
          setIsHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [profile?.id]);

  /* ─────────────────────────────────────────────
     Load messages for selected conversation
  ───────────────────────────────────────────── */

  useEffect(() => {
    const requestId = ++conversationRequestRef.current;

    if (!activeConversationId) {
      setMessages([INITIAL_MESSAGE]);
      setMessageTimestamps(new Map());
      setIsConversationLoading(false);
      return;
    }

    let active = true;

    async function loadConversation() {
      setIsConversationLoading(true);
      setHistoryError("");

      setMessageTimestamps(new Map());

      const conversationId = activeConversationId;

      if (!conversationId) {
        setIsConversationLoading(false);
        return;
      }

      try {
        const data = await getAIMessages(conversationId);

        if (!active || requestId !== conversationRequestRef.current) {
          return;
        }

        if (data.length === 0) {
          setMessages([INITIAL_MESSAGE]);
          setMessageTimestamps(new Map());
        } else {
          const mapped = data.map(mapHistoryMessage);

          const timestamps = new Map<number, string>();

          data.forEach((item, index) => {
            timestamps.set(index, item.created_at);
          });

          setMessages(mapped);
          setMessageTimestamps(timestamps);
        }
      } catch (error) {
        console.error("Could not load conversation:", error);

        if (active && requestId === conversationRequestRef.current) {
          setHistoryError(
            "This conversation couldn't be loaded. Please try again.",
          );

          setMessages([INITIAL_MESSAGE]);
          setMessageTimestamps(new Map());
        }
      } finally {
        if (active && requestId === conversationRequestRef.current) {
          setIsConversationLoading(false);
        }
      }
    }

    void loadConversation();

    return () => {
      active = false;
    };
  }, [activeConversationId]);

  /* ─────────────────────────────────────────────
     Scroll chat only — NEVER the whole page
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (isConversationLoading) return;

    const container = messagesContainerRef.current;

    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages, isThinking, isConversationLoading]);

  /* ─────────────────────────────────────────────
     Focus input
  ───────────────────────────────────────────── */

  useEffect(() => {
    if (isConversationLoading) return;

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeConversationId, isConversationLoading]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [conversations, activeConversationId],
  );

  /* ─────────────────────────────────────────────
     New conversation
  ───────────────────────────────────────────── */

  async function handleNewConversation() {
    if (!profile?.id || isThinking) return;

    setHistoryError("");

    try {
      const conversation = await createAIConversation("New conversation");

      setConversations((current) => [conversation, ...current]);

      setActiveConversationId(conversation.id);
      setMessages([INITIAL_MESSAGE]);
      setMessageTimestamps(new Map());
      setMobileHistoryOpen(false);
    } catch (error) {
      console.error("Could not create AI conversation:", error);

      setHistoryError(
        "We couldn't start a new conversation. Please try again.",
      );
    }
  }

  /* ─────────────────────────────────────────────
     Select conversation
  ───────────────────────────────────────────── */

  function handleSelectConversation(conversationId: string) {
    if (isThinking) return;

    if (conversationId === activeConversationId) {
      setMobileHistoryOpen(false);
      return;
    }

    setHistoryError("");
    setMobileHistoryOpen(false);

    /*
     * Clear the visible messages immediately.
     * This prevents the previous conversation from
     * flashing while Supabase loads the new one.
     */
    setMessages([INITIAL_MESSAGE]);
    setMessageTimestamps(new Map());

    setActiveConversationId(conversationId);
  }

  /* ─────────────────────────────────────────────
     Delete conversation
  ───────────────────────────────────────────── */

  async function handleDeleteConversation(conversationId: string) {
    if (isThinking) return;

    const confirmed = window.confirm(
      "Delete this conversation? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteAIConversation(conversationId);

      const remaining = conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      setConversations(remaining);

      if (conversationId === activeConversationId) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([INITIAL_MESSAGE]);
          setMessageTimestamps(new Map());
        }
      }
    } catch (error) {
      console.error("Could not delete AI conversation:", error);

      setHistoryError(
        "We couldn't delete that conversation. Please try again.",
      );
    }
  }

  /* ─────────────────────────────────────────────
     Send message
  ───────────────────────────────────────────── */

  async function handleSend(customMessage?: string) {
    const userMessage = (customMessage ?? message).trim();

    if (!userMessage || isThinking || !profile?.id) {
      return;
    }

    setHistoryError("");

    let conversationId = activeConversationId;

    try {
      /*
       * Create conversation if this is the first message.
       */
      if (!conversationId) {
        const conversation = await createAIConversation(
          makeConversationTitle(userMessage),
        );

        conversationId = conversation.id;

        setConversations((current) => [conversation, ...current]);

        setActiveConversationId(conversation.id);
      }

      const userChatMessage: ChatMessage = {
        sender: "student",
        text: userMessage,
      };

      const conversationMessages = messages.filter(
        (item, index) =>
          !(
            index === 0 &&
            item.sender === "mindSync" &&
            item.text === INITIAL_MESSAGE.text
          ),
      );

      const updatedMessages = [...conversationMessages, userChatMessage];

      /*
       * Optimistic UI.
       */
      setMessages((current) => [...current, userChatMessage]);

      setMessageTimestamps((previous) => {
        const next = new Map(previous);

        next.set(updatedMessages.length - 1, new Date().toISOString());

        return next;
      });

      setMessage("");

      /*
       * Reset textarea height after sending.
       */
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      setIsThinking(true);

      /*
       * Save student message.
       */
      await saveAIMessage(conversationId, "student", userMessage);

      /*
       * Update title for a new conversation.
       */
      const currentConversation = conversations.find(
        (conversation) => conversation.id === conversationId,
      );

      if (
        !currentConversation ||
        currentConversation.title === "New conversation"
      ) {
        const title = makeConversationTitle(userMessage);

        await updateAIConversation(conversationId, title);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  title,
                  updated_at: new Date().toISOString(),
                }
              : conversation,
          ),
        );
      }

      /*
       * Build personal wellness context.
       */
      const context = await buildMindSyncContext(
        profile.id,
        updatedMessages,
        currentConversation?.title,
      );

      /*
       * Call Groq backend.
       */
      const aiText = await getAIResponse(userMessage, updatedMessages, context);

      const aiMessage: ChatMessage = {
        sender: "mindSync",
        text: aiText,
      };

      setMessages((currentMessages) => [...currentMessages, aiMessage]);

      setMessageTimestamps((previous) => {
        const next = new Map(previous);

        next.set(updatedMessages.length, new Date().toISOString());

        return next;
      });

      /*
       * Save AI response.
       */
      await saveAIMessage(conversationId, "mindSync", aiText);

      await touchAIConversation(conversationId);

      const updatedAt = new Date().toISOString();

      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  updated_at: updatedAt,
                }
              : conversation,
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          ),
      );
    } catch (error) {
      console.error("MindSync AI error:", error);

      setHistoryError(
        "MindSync couldn't complete that response. Please try again.",
      );
    } finally {
      setIsThinking(false);

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  /* ─────────────────────────────────────────────
     Conversation list
  ───────────────────────────────────────────── */

  function renderConversationList() {
    if (isHistoryLoading) {
      return (
        <div className="aih-loading">
          <div className="aih-loading-row" />
          <div className="aih-loading-row" />
          <div className="aih-loading-row aih-loading-row-short" />
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <div className="aih-empty">
          <MessageCircle size={22} />

          <p>No conversations yet</p>

          <span>Your conversations will appear here.</span>
        </div>
      );
    }

    return (
      <div className="aih-list">
        {conversations.map((conversation) => {
          const selected = conversation.id === activeConversationId;

          return (
            <div
              className={`aih-item ${selected ? "aih-item-active" : ""}`}
              key={conversation.id}
            >
              <button
                className="aih-item-btn"
                onClick={() => handleSelectConversation(conversation.id)}
                disabled={isThinking}
              >
                <div className="aih-item-icon">
                  <MessageCircle size={15} />
                </div>

                <div className="aih-item-text">
                  <span className="aih-item-title">{conversation.title}</span>

                  <span className="aih-item-date">
                    {formatConversationDate(conversation.updated_at)}
                  </span>
                </div>
              </button>

              <button
                className="aih-item-delete"
                aria-label={`Delete ${conversation.title}`}
                title="Delete"
                onClick={() => void handleDeleteConversation(conversation.id)}
                disabled={isThinking}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */

  return (
    <main className="page aic-page">
      {mobileHistoryOpen && (
        <button
          className="aic-mobile-backdrop"
          aria-label="Close conversations"
          onClick={() => setMobileHistoryOpen(false)}
        />
      )}

      <div className="aic-shell">
        {/* ───────── SIDEBAR ───────── */}

        <aside
          className={`aic-sidebar ${
            mobileHistoryOpen ? "aic-sidebar-open" : ""
          }`}
        >
          <div className="aic-sidebar-head">
            <div>
              <span className="aic-sidebar-brand">AI Companion</span>

              <span className="aic-sidebar-sub">Your conversations</span>
            </div>

            <button
              className="aic-sidebar-close"
              aria-label="Close"
              onClick={() => setMobileHistoryOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <button
            className="aic-new-btn"
            onClick={() => void handleNewConversation()}
            disabled={isThinking}
          >
            <Plus size={16} />
            <span>New conversation</span>
          </button>

          <div className="aih-divider" />

          {renderConversationList()}

          <div className="aic-sidebar-footer">
            <ShieldCheck size={14} />

            <span>Private to your account</span>
          </div>
        </aside>

        {/* ───────── CHAT ───────── */}

        <div className="aic-chat">
          {/* Header */}

          <header className="aic-chat-head">
            <div className="aic-chat-head-left">
              <button
                className="aic-mobile-menu"
                onClick={() => setMobileHistoryOpen(true)}
                aria-label="Open conversations"
              >
                <Clock3 size={18} />
              </button>

              <div className="aic-head-avatar">
                <Sparkles size={18} />
              </div>

              <div className="aic-head-info">
                <h2>MindSync</h2>

                <p>
                  {isThinking
                    ? "Typing..."
                    : "A supportive space for reflection"}
                </p>
              </div>
            </div>

            <div className="aic-head-status">
              <span className="aic-status-dot" />
              Available
            </div>
          </header>

          {/* Error */}

          {historyError && (
            <div className="aic-error" role="alert">
              <span>{historyError}</span>

              <button onClick={() => setHistoryError("")} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Messages */}

          <div
            ref={messagesContainerRef}
            className="aic-messages"
            aria-live="polite"
          >
            {isConversationLoading ? (
              <div className="aic-msg-loading">
                <div className="aic-msg-loading-avatar">
                  <Sparkles size={15} />
                </div>

                <div className="aic-msg-loading-lines">
                  <span className="aic-msg-loading-line aic-msg-loading-wide" />
                  <span className="aic-msg-loading-line aic-msg-loading-short" />
                </div>
              </div>
            ) : (
              <>
                {messages.map((item, index) => {
                  const isStudent = item.sender === "student";

                  const isWelcome =
                    index === 0 &&
                    item.sender === "mindSync" &&
                    item.text === INITIAL_MESSAGE.text;

                  const timestamp = messageTimestamps.get(index);

                  return (
                    <div
                      className={`aic-msg-row ${
                        isStudent ? "aic-msg-row-student" : ""
                      }`}
                      key={`${item.sender}-${index}-${item.text.slice(0, 10)}`}
                    >
                      {!isStudent && (
                        <div className="aic-msg-avatar">
                          <Sparkles size={13} />
                        </div>
                      )}

                      <div className="aic-msg-content">
                        <div
                          className={`aic-msg ${
                            isStudent ? "aic-msg-student" : "aic-msg-ai"
                          }`}
                        >
                          {!isStudent && (
                            <span className="aic-msg-label">MINDSYNC</span>
                          )}

                          {isWelcome ? (
                            <div className="aic-msg-welcome">
                              {item.text.split("\n").map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                            </div>
                          ) : (
                            <div className="aic-markdown">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => <p>{children}</p>,

                                  strong: ({ children }) => (
                                    <strong className="aic-markdown-strong">
                                      {children}
                                    </strong>
                                  ),

                                  ul: ({ children }) => (
                                    <ul className="aic-markdown-list">
                                      {children}
                                    </ul>
                                  ),

                                  ol: ({ children }) => (
                                    <ol className="aic-markdown-list">
                                      {children}
                                    </ol>
                                  ),

                                  li: ({ children }) => <li>{children}</li>,

                                  h1: ({ children }) => (
                                    <h3 className="aic-markdown-heading">
                                      {children}
                                    </h3>
                                  ),

                                  h2: ({ children }) => (
                                    <h3 className="aic-markdown-heading">
                                      {children}
                                    </h3>
                                  ),

                                  h3: ({ children }) => (
                                    <h3 className="aic-markdown-heading">
                                      {children}
                                    </h3>
                                  ),

                                  blockquote: ({ children }) => (
                                    <blockquote className="aic-markdown-quote">
                                      {children}
                                    </blockquote>
                                  ),
                                }}
                              >
                                {item.text}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {timestamp && (
                          <span
                            className={`aic-msg-time ${
                              isStudent ? "aic-msg-time-right" : ""
                            }`}
                          >
                            {formatMessageTime(timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Suggestions */}

                {messages.length === 1 && !isThinking && (
                  <div className="aic-suggestions">
                    <p>What would you like to talk about?</p>

                    <div className="aic-suggestions-grid">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          className="aic-suggestion-chip"
                          onClick={() => void handleSend(prompt)}
                          disabled={isThinking}
                        >
                          <span>{prompt}</span>

                          <ArrowRight size={13} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Typing */}

                {isThinking && (
                  <div className="aic-msg-row">
                    <div className="aic-msg-avatar">
                      <Sparkles size={13} />
                    </div>

                    <div className="aic-msg-content">
                      <div className="aic-msg aic-msg-ai aic-msg-thinking">
                        <span className="aic-msg-label">MINDSYNC</span>

                        <div className="aic-typing">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Composer */}

          <div className="aic-composer-wrap">
            <div className="aic-composer">
              <textarea
                ref={inputRef}
                aria-label="Message MindSync"
                rows={1}
                value={message}
                disabled={isThinking || isConversationLoading}
                onChange={(event) => {
                  setMessage(event.target.value);

                  const el = event.currentTarget;

                  el.style.height = "auto";

                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isThinking ? "MindSync is typing..." : "Message MindSync..."
                }
              />

              <button
                className="aic-send"
                onClick={() => void handleSend()}
                disabled={
                  isThinking ||
                  isConversationLoading ||
                  !message.trim() ||
                  !profile?.id
                }
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>

            <div className="aic-composer-foot">
              <span>
                <ShieldCheck size={12} />
                Private
              </span>

              <span>MindSync AI can make mistakes. Use your judgment.</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`

        /* ═══════════════════════════════════════════
           MINDSYNC AI COMPANION
           PREMIUM CHAT UI
        ═══════════════════════════════════════════ */

        .aic-page {
          width: 100%;
          max-width: none;
          height: calc(100vh - 90px);
          min-height: 0;
          margin: 0;
          padding-bottom: 0;
          display: flex;
          flex-direction: column;
          align-self: stretch;
          box-sizing: border-box;
        }

        .aic-shell {
          width: 100%;
          max-width: none;
          flex: 1 1 auto;
          min-height: 0;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          overflow: hidden;
          align-self: stretch;
          border: 1px solid rgba(48, 91, 70, 0.08);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 20px 60px rgba(37, 78, 59, 0.07),
            0 2px 12px rgba(37, 78, 59, 0.03);
        }

        /* ═══════════════════════════════════════════
           SIDEBAR
        ═══════════════════════════════════════════ */

        .aic-sidebar {
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-right: 1px solid rgba(48, 91, 70, 0.07);
          background:
            linear-gradient(
              180deg,
              rgba(246, 250, 247, 0.98),
              rgba(242, 248, 244, 0.9)
            );
          padding: 20px 12px 14px;
        }

        .aic-sidebar-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 2px 8px 16px;
        }

        .aic-sidebar-brand {
          display: block;
          color: #29483a;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .aic-sidebar-sub {
          display: block;
          margin-top: 3px;
          color: #81968c;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .aic-sidebar-close {
          display: none;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 8px;
          background: #fff;
          color: #638174;
          cursor: pointer;
        }

        .aic-new-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 12px;
          border: 1px solid rgba(54, 120, 87, 0.14);
          border-radius: 12px;
          background: #fff;
          color: #326c52;
          cursor: pointer;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          transition:
            transform 150ms ease,
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .aic-new-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(54, 120, 87, 0.26);
          box-shadow:
            0 6px 18px rgba(39, 100, 70, 0.07);
        }

        .aic-new-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .aih-divider {
          height: 1px;
          background: rgba(48, 91, 70, 0.07);
          margin: 14px 6px 10px;
        }

        .aih-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .aih-item {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 3px;
          border-radius: 11px;
          transition: background 140ms ease;
        }

        .aih-item:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .aih-item-active {
          background: rgba(219, 239, 226, 0.72);
        }

        .aih-item-btn {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 8px;
          border: 0;
          background: transparent;
          color: #385b4b;
          text-align: left;
          cursor: pointer;
        }

        .aih-item-icon {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.75);
          color: #609078;
        }

        .aih-item-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .aih-item-title {
          overflow: hidden;
          color: #416355;
          font-size: 12px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .aih-item-date {
          color: #96a9a0;
          font-size: 10px;
        }

        .aih-item-delete {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 4px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #9aaba3;
          cursor: pointer;
          opacity: 0;
          transition:
            opacity 130ms ease,
            background 130ms ease,
            color 130ms ease;
        }

        .aih-item:hover .aih-item-delete,
        .aih-item-active .aih-item-delete {
          opacity: 1;
        }

        .aih-item-delete:hover:not(:disabled) {
          background: #fff;
          color: #b45f5f;
        }

        .aih-loading {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 6px;
        }

        .aih-loading-row {
          height: 44px;
          border-radius: 11px;
          background:
            linear-gradient(
              90deg,
              #e8f0eb,
              #f6f9f7,
              #e8f0eb
            );
          background-size: 200% 100%;
          animation: aicShimmer 1.4s infinite;
        }

        .aih-loading-row-short {
          width: 70%;
        }

        .aih-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 14px;
          color: #91a39b;
          text-align: center;
        }

        .aih-empty svg {
          margin-bottom: 10px;
          color: #78a58d;
        }

        .aih-empty p {
          margin: 0 0 3px;
          color: #638073;
          font-size: 12px;
          font-weight: 700;
        }

        .aih-empty span {
          font-size: 10px;
          line-height: 1.5;
        }

        .aic-sidebar-footer {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: auto;
          padding: 12px 6px 0;
          border-top: 1px solid rgba(48, 91, 70, 0.07);
          color: #91a39b;
          font-size: 9px;
          line-height: 1.45;
        }

        .aic-sidebar-footer svg {
          flex: 0 0 auto;
          color: #6c9c81;
          margin-top: 1px;
        }

        /* ═══════════════════════════════════════════
           CHAT AREA
        ═══════════════════════════════════════════ */

        .aic-chat {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
        }

        /*
         * IMPORTANT:
         * This closing brace fixes the original CSS bug.
         */

        .aic-chat-head {
          flex: 0 0 68px;
          min-height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 20px;
          border-bottom: 1px solid rgba(48, 91, 70, 0.07);
          background: rgba(255, 255, 255, 0.96);
        }

        .aic-chat-head-left {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .aic-mobile-menu {
          display: none;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(59, 117, 85, 0.12);
          border-radius: 9px;
          background: #fff;
          color: #5b806d;
          cursor: pointer;
        }

        .aic-head-avatar {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background:
            linear-gradient(
              145deg,
              #dff1e5,
              #eef8f1
            );
          color: #347a58;
          box-shadow:
            inset 0 0 0 1px
            rgba(56, 126, 87, 0.07);
        }

        .aic-head-info {
          min-width: 0;
        }

        .aic-head-info h2 {
          margin: 0;
          color: #29493b;
          font-size: 15px;
          letter-spacing: -0.02em;
        }

        .aic-head-info p {
          margin: 2px 0 0;
          color: #91a198;
          font-size: 11px;
        }

        .aic-head-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: #edf8f0;
          color: #4f8869;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .aic-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #58a977;
          box-shadow:
            0 0 0 3px
            rgba(88, 169, 119, 0.15);
        }

        .aic-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 10px 18px 0;
          padding: 9px 11px;
          border: 1px solid #f0d5ce;
          border-radius: 10px;
          background: #fff7f4;
          color: #a85f50;
          font-size: 11px;
        }

        .aic-error button {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        /* ═══════════════════════════════════════════
           MESSAGE AREA
        ═══════════════════════════════════════════ */

        .aic-messages {
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px 32px 18px;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color:
            rgba(88, 130, 108, 0.25)
            transparent;
        }

        .aic-msg-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          width: fit-content;
          max-width: min(88%, 920px);
          margin-bottom: 14px;
          animation: aicMsgIn 200ms ease both;
        }

        .aic-msg-row-student {
          margin-left: auto;
          justify-content: flex-end;
        }

        .aic-msg-avatar {
          width: 26px;
          height: 26px;
          flex: 0 0 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #eaf5ed;
          color: #4c8c69;
        }

        .aic-msg-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .aic-msg {
          width: fit-content;
          max-width: 100%;
          box-sizing: border-box;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
          box-shadow:
            0 3px 12px
            rgba(42, 85, 64, 0.03);
        }

        .aic-msg p {
          margin: 0;
        }

        .aic-msg p + p {
          margin-top: 6px;
        }
          .aic-markdown {
  color: inherit;
  font-size: inherit;
  line-height: 1.7;
}

.aic-markdown p {
  margin: 0;
}

.aic-markdown p + p {
  margin-top: 10px;
}

.aic-markdown-strong {
  color: #294f3e;
  font-weight: 800;
}

.aic-msg-student .aic-markdown-strong {
  color: #fff;
}

.aic-markdown-heading {
  margin: 12px 0 6px;
  color: #294f3e;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

.aic-msg-student .aic-markdown-heading {
  color: #fff;
}

.aic-markdown-list {
  margin: 8px 0;
  padding-left: 20px;
}

.aic-markdown-list li {
  margin: 5px 0;
  padding-left: 2px;
}

.aic-markdown-quote {
  margin: 10px 0;
  padding: 8px 12px;
  border-left: 3px solid #6c9d82;
  border-radius: 0 8px 8px 0;
  background: rgba(91, 145, 112, 0.07);
  color: #567264;
}

.aic-msg-student .aic-markdown-quote {
  border-left-color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
        .aic-msg-ai {
          border: 1px solid
            rgba(61, 119, 86, 0.07);
          border-bottom-left-radius: 5px;
          background: #f0f7f2;
          color: #2e4d3e;
        }

        .aic-msg-student {
          border-bottom-right-radius: 5px;
          background: #286c56;
          color: #fff;
        }

        .aic-msg-label {
          display: block;
          margin-bottom: 5px;
          color: #5d8a70;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0.7;
        }

        .aic-msg-thinking {
          padding: 14px 16px;
        }

        .aic-msg-welcome {
          line-height: 1.7;
        }

        .aic-msg-welcome p:first-child {
          font-size: 15px;
          font-weight: 700;
          color: #2e4d3e;
        }

        .aic-msg-welcome p:nth-child(2) {
          font-size: 13px;
          color: #556e62;
        }

        .aic-msg-time {
          font-size: 9px;
          color: #a3b5ad;
          padding: 0 2px;
        }

        .aic-msg-time-right {
          text-align: right;
        }

        /* ═══════════════════════════════════════════
           TYPING
        ═══════════════════════════════════════════ */

        .aic-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 18px;
        }

        .aic-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6b947e;
          animation:
            aicTyping
            1.2s
            infinite
            ease-in-out;
        }

        .aic-typing span:nth-child(2) {
          animation-delay: 150ms;
        }

        .aic-typing span:nth-child(3) {
          animation-delay: 300ms;
        }

        /* ═══════════════════════════════════════════
           SUGGESTIONS
        ═══════════════════════════════════════════ */

        .aic-suggestions {
          max-width: 520px;
          margin: 24px auto 4px;
        }

        .aic-suggestions > p {
          margin: 0 0 10px;
          color: #8b9d95;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          text-align: center;
        }

        .aic-suggestions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .aic-suggestion-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 11px 13px;
          border: 1px solid
            rgba(61, 119, 86, 0.1);
          border-radius: 12px;
          background: #fff;
          color: #527363;
          cursor: pointer;
          font-size: 12px;
          text-align: left;
          transition:
            transform 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease;
        }

        .aic-suggestion-chip:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color:
            rgba(61, 119, 86, 0.22);
          box-shadow:
            0 6px 18px
            rgba(42, 85, 64, 0.06);
        }

        .aic-suggestion-chip svg {
          color: #6c9d82;
          flex: 0 0 auto;
        }

        .aic-suggestion-chip:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ═══════════════════════════════════════════
           LOADING
        ═══════════════════════════════════════════ */

        .aic-msg-loading {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 260px;
        }

        .aic-msg-loading-avatar {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eaf4ed;
          color: #68977c;
        }

        .aic-msg-loading-lines {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .aic-msg-loading-line {
          display: block;
          height: 8px;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              #e6eee9,
              #f5f8f6,
              #e6eee9
            );
          background-size: 200% 100%;
          animation:
            aicShimmer
            1.3s
            infinite;
        }

        .aic-msg-loading-wide {
          width: 170px;
        }

        .aic-msg-loading-short {
          width: 110px;
        }

        /* ═══════════════════════════════════════════
           COMPOSER
        ═══════════════════════════════════════════ */

        .aic-composer-wrap {
          flex: 0 0 auto;
          width: 100%;
          box-sizing: border-box;
          padding: 12px 24px 16px;
          border-top: 1px solid
            rgba(48, 91, 70, 0.07);
          background:
            rgba(255, 255, 255, 0.96);
        }

        .aic-composer {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 6px 6px 6px 14px;
          border: 1px solid
            rgba(48, 91, 70, 0.12);
          border-radius: 14px;
          background: #fff;
          box-shadow:
            0 6px 20px
            rgba(40, 85, 62, 0.035);
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .aic-composer:focus-within {
          border-color:
            rgba(54, 120, 87, 0.3);
          box-shadow:
            0 0 0 3px
            rgba(71, 143, 102, 0.06),
            0 6px 20px
            rgba(40, 85, 62, 0.05);
        }

        .aic-composer textarea {
          min-width: 0;
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          color: #345747;
          font: inherit;
          font-size: 13px;
          line-height: 1.5;
          resize: none;
          max-height: 120px;
          padding: 7px 0;
        }

        .aic-composer textarea::placeholder {
          color: #9aa9a2;
        }

        .aic-send {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 10px;
          background: #286c56;
          color: #fff;
          cursor: pointer;
          box-shadow:
            0 5px 12px
            rgba(40, 108, 86, 0.18);
          transition:
            transform 140ms ease,
            opacity 140ms ease;
        }

        .aic-send:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .aic-send:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }

        .aic-composer-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 7px;
          padding: 0 2px;
          color: #9aa8a1;
          font-size: 9px;
        }

        .aic-composer-foot span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .aic-composer-foot span:first-child {
          color: #78958a;
        }

        /* ═══════════════════════════════════════════
           ANIMATIONS
        ═══════════════════════════════════════════ */

        @keyframes aicMsgIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes aicTyping {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        @keyframes aicShimmer {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -200% 0;
          }
        }


        @media (min-width: 1200px) {
          .aic-shell {
            grid-template-columns: 300px minmax(0, 1fr);
          }

          .aic-messages {
            padding-left: 38px;
            padding-right: 38px;
          }

          .aic-msg-row {
            max-width: min(90%, 980px);
          }
        }

        /* ═══════════════════════════════════════════
           MOBILE
        ═══════════════════════════════════════════ */

        .aic-mobile-backdrop {
          display: none;
        }

        @media (max-width: 900px) {
          .aic-shell {
            grid-template-columns: 1fr;
          }

          .aic-sidebar {
            position: fixed;
            z-index: 1000;
            top: 0;
            bottom: 0;
            left: 0;
            width: min(300px, 88vw);
            transform: translateX(-105%);
            transition:
              transform 220ms ease;
            box-shadow:
              16px 0 45px
              rgba(20, 53, 39, 0.18);
          }

          .aic-sidebar-open {
            transform: translateX(0);
          }

          .aic-sidebar-close {
            display: flex;
          }

          .aic-mobile-backdrop {
            position: fixed;
            z-index: 999;
            inset: 0;
            display: block;
            border: 0;
            background:
              rgba(19, 43, 33, 0.22);
            backdrop-filter: blur(3px);
          }

          .aic-mobile-menu {
            display: flex;
          }

          .aic-head-status {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .aic-page {
            width: 100%;
            max-width: none;
            height: calc(100vh - 70px);
            min-height: 0;
          }

          .aic-shell {
            border-radius: 0;
            border: 0;
          }

          .aic-chat-head {
            padding: 12px 14px;
          }

          .aic-messages {
            width: 100%;
            padding: 18px 12px 14px;
          }

          .aic-msg-row,
          .aic-msg-row-student {
            width: fit-content;
            max-width: 94%;
          }

          .aic-composer-wrap {
            padding: 10px 12px 12px;
          }

          .aic-composer-foot {
            flex-direction: column;
            align-items: flex-start;
          }

          .aic-suggestions-grid {
            grid-template-columns: 1fr;
          }
        }

      `}</style>
    </main>
  );
}
