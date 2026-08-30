import {
  ArrowUp,
  ChevronLeft,
  FileText,
  Info,
  MessageCircle,
  Paperclip,
  Phone,
  Search,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  mine: boolean;
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  status: string;
  initials: string;
}

const DEMO_CONVERSATION: Conversation = {
  id: "demo-professional",
  name: "Dr. Demo Professional",
  status: "Available · typically replies within a day",
  initials: "DP",
};

const INITIAL_MESSAGES: Message[] = [
  {
    mine: false,
    text: "Hi Demo, I'm glad you reached out. How has your week been feeling?",
    time: "10:04 AM",
  },
  {
    mine: true,
    text: "A little overwhelming, but I'm trying to take it one day at a time.",
    time: "10:06 AM",
  },
  {
    mine: false,
    text: "That sounds like a thoughtful way to meet it. What has helped you feel even a little steadier?",
    time: "10:07 AM",
  },
];

const QUICK_PROMPTS = [
  { label: "Add a note", text: "I'd like to share something that happened..." },
  { label: "What I'm feeling", text: "I'm feeling..." },
  { label: "Ask a question", text: "I'd like to ask about..." },
];

export default function Chat() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({
    [DEMO_CONVERSATION.id]: INITIAL_MESSAGES,
  });
  const [message, setMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldScrollToLatest = useRef(false);

  const activeConversation =
    activeConversationId === DEMO_CONVERSATION.id ? DEMO_CONVERSATION : null;
  const messages = activeConversation
    ? messagesByConversation[activeConversation.id] ?? []
    : [];

  useEffect(() => {
    if (!activeConversationId || !shouldScrollToLatest.current) return;

    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
    shouldScrollToLatest.current = false;
  }, [activeConversationId, messages]);

  function selectConversation(conversationId: string) {
    shouldScrollToLatest.current = true;
    setShowDetails(false);
    setActiveConversationId(conversationId);
  }

  function send() {
    const text = message.trim();
    if (!text || !activeConversation) return;

    shouldScrollToLatest.current = true;
    setMessagesByConversation((current) => ({
      ...current,
      [activeConversation.id]: [
        ...(current[activeConversation.id] ?? []),
        {
          mine: true,
          text,
          time: new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ],
    }));
    setMessage("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  const latestMessage = messagesByConversation[DEMO_CONVERSATION.id].at(-1);

  return (
    <main className="page pro-chat-page ms-messages-page ms-workspace-page">
      <section className="ms-messages-workspace" aria-label="Messages">
        <aside className={`surface ms-conversation-list${activeConversation ? " ms-conversation-list--hidden-mobile" : ""}`}>
          <header className="ms-conversation-list-header">
            <h1>Messages</h1>
            <p>Your conversations</p>
            <span>A private space to stay connected between sessions.</span>
          </header>

          <nav className="ms-conversation-items" aria-label="Conversations">
            <button
              type="button"
              className={`ms-conversation-item${activeConversation ? " ms-conversation-item--selected" : ""}`}
              aria-current={activeConversation ? "page" : undefined}
              onClick={() => selectConversation(DEMO_CONVERSATION.id)}
            >
              <span className="ms-conversation-avatar" aria-hidden="true">
                {DEMO_CONVERSATION.initials}
              </span>
              <span className="ms-conversation-summary">
                <span className="ms-conversation-row">
                  <strong>{DEMO_CONVERSATION.name}</strong>
                  <time>{latestMessage?.time}</time>
                </span>
                <span className="ms-conversation-preview">
                  {latestMessage?.text ?? "No messages yet"}
                </span>
              </span>
            </button>
          </nav>
        </aside>

        <section className={`surface ms-chat-panel${activeConversation ? " ms-chat-panel--active" : ""}`}>
          {!activeConversation ? (
            <div className="ms-select-conversation-empty">
              <span className="ms-select-conversation-icon" aria-hidden="true">
                <MessageCircle size={25} />
              </span>
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the left to view your messages.</p>
            </div>
          ) : (
            <>
              <header className="ms-active-chat-header">
                <div className="ms-active-chat-person">
                  <button
                    type="button"
                    className="ms-back-to-conversations"
                    aria-label="Back to conversations"
                    onClick={() => setActiveConversationId(null)}
                  >
                    <ChevronLeft size={19} />
                  </button>
                  <span className="ms-professional-avatar" aria-hidden="true">
                    {activeConversation.initials}
                  </span>
                  <span className="ms-professional-details">
                    <strong>{activeConversation.name}</strong>
                    <span><i aria-hidden="true" />{activeConversation.status}</span>
                  </span>
                </div>
                <div className="ms-header-actions" aria-label="Conversation actions">
                  <button
                    type="button"
                    className="ms-header-action ms-header-action--unavailable"
                    disabled
                    aria-label="Start video call is unavailable"
                    title="Start video call is unavailable"
                  >
                    <Video size={18} />
                  </button>
                  <button
                    type="button"
                    className="ms-header-action ms-header-action--unavailable"
                    disabled
                    aria-label="Start voice call is unavailable"
                    title="Start voice call is unavailable"
                  >
                    <Phone size={17} />
                  </button>
                  <button
                    type="button"
                    className="ms-header-action ms-header-action--unavailable"
                    disabled
                    aria-label="Search conversation is unavailable"
                    title="Search conversation is unavailable"
                  >
                    <Search size={17} />
                  </button>
                  <button
                    type="button"
                    className="ms-header-action ms-details-button"
                    aria-label="Conversation details"
                    title="Conversation details"
                    aria-expanded={showDetails}
                    aria-controls="conversation-details"
                    onClick={() => setShowDetails((open) => !open)}
                  >
                    <Info size={18} />
                  </button>
                </div>
              </header>

              <div ref={messagesRef} className="ms-message-list" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="ms-empty-state">
                    <FileText size={24} aria-hidden="true" />
                    <strong>No messages yet</strong>
                    <span>Send a message to start the conversation.</span>
                  </div>
                ) : (
                  messages.map((item, index) => {
                    const followsSameSender =
                      index > 0 && messages[index - 1].mine === item.mine;

                    return (
                      <article
                        key={`${item.time}-${index}`}
                        className={`ms-message ${item.mine ? "ms-message--mine" : ""}${
                          followsSameSender ? " ms-message--grouped" : ""
                        }`}
                      >
                        {!followsSameSender && (
                          <span className="ms-message-sender">
                            {item.mine ? "You" : activeConversation.name}
                          </span>
                        )}
                        <p>{item.text}</p>
                        <time>{item.time}</time>
                      </article>
                    );
                  })
                )}
              </div>

              <form
                className="ms-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  send();
                }}
              >
                <button
                  type="button"
                  className="ms-attachment-button"
                  disabled
                  aria-label="Attachments are unavailable"
                  title="Attachments are unavailable"
                >
                  <Paperclip size={19} />
                </button>
                <label className="sr-only" htmlFor="professional-message">
                  Message {activeConversation.name}
                </label>
                <textarea
                  id="professional-message"
                  ref={inputRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Write a message..."
                  rows={1}
                />
                <button
                  type="submit"
                  className="ms-send-button"
                  disabled={!message.trim()}
                  aria-label="Send message"
                >
                  <ArrowUp size={19} strokeWidth={2.75} />
                  <span>Send</span>
                </button>
              </form>

              <div className="ms-quick-actions" aria-label="Message suggestions">
                <button
                  type="button"
                  disabled
                  title="Photo attachments are unavailable"
                  aria-label="Share a photo is unavailable"
                >
                  Share a photo
                </button>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => {
                      setMessage(prompt.text);
                      window.setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>

              {showDetails && (
                <aside id="conversation-details" className="ms-details-panel" aria-label="Conversation details">
                  <div className="ms-note-heading">
                    <h2>Conversation note</h2>
                    <button type="button" aria-label="Close conversation details" onClick={() => setShowDetails(false)}>×</button>
                  </div>
                  <p>
                    Messages are a great place for reflections between sessions. If something feels urgent,
                    please use immediate support instead of waiting for a reply.
                  </p>
                  <dl>
                    <div><dt>Last session</dt><dd>Aug 14</dd></div>
                    <div><dt>Next availability</dt><dd>This week</dd></div>
                  </dl>
                </aside>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}
