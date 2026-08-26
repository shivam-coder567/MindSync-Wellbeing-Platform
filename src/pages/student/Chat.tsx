import {
  Paperclip,
  Video,
  ChevronLeft,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   TEXT SIZE
───────────────────────────────────────────────────────────── */

const STORAGE_KEY = "mindSync_chat_text_scale";

const SCALE_STEPS = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4] as const;

const DEFAULT_SCALE = 1.0;

function getStoredScale(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored !== null) {
      const value = parseFloat(stored);

      if (!Number.isNaN(value) && value >= 0.8 && value <= 1.4) {
        return value;
      }
    }
  } catch {
    // Ignore localStorage errors.
  }

  return DEFAULT_SCALE;
}

function clampScale(value: number): number {
  return Math.min(1.4, Math.max(0.8, Math.round(value * 10) / 10));
}

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface Msg {
  mine: boolean;
  text: string;
  time: string;
}

/* ─────────────────────────────────────────────────────────────
   CHAT
───────────────────────────────────────────────────────────── */

export default function Chat() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Msg[]>([
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
  ]);

  const [textScale, setTextScale] = useState<number>(getStoredScale);

  const [mobileShowNote, setMobileShowNote] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(DEFAULT_SCALE);

  /* ───────────────────────────────────────────────────────────
     SAVE TEXT SIZE
  ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(textScale));
    } catch {
      // Ignore localStorage errors.
    }
  }, [textScale]);

  /* ───────────────────────────────────────────────────────────
     APPLY SCALE TO CHAT PANEL
  ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    const panel = chatAreaRef.current;

    if (!panel) return;

    panel.style.setProperty("--chat-text-scale", String(textScale));
  }, [textScale]);

  /* ───────────────────────────────────────────────────────────
     AUTO SCROLL
  ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  /* ───────────────────────────────────────────────────────────
     TEXT SIZE BUTTONS
  ─────────────────────────────────────────────────────────── */

  const stepText = useCallback((direction: -1 | 1) => {
    setTextScale((currentScale) => {
      let currentIndex = SCALE_STEPS.findIndex(
        (value) => value >= currentScale,
      );

      if (currentIndex === -1) {
        currentIndex = direction === -1 ? 0 : SCALE_STEPS.length - 1;
      }

      const nextIndex = Math.max(
        0,
        Math.min(SCALE_STEPS.length - 1, currentIndex + direction),
      );

      return SCALE_STEPS[nextIndex];
    });
  }, []);

  /* ───────────────────────────────────────────────────────────
     PINCH TO CHANGE CHAT TEXT SIZE
     
     Two fingers:
       pinch inward  → smaller text
       pinch outward → larger text
  ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    const element = chatAreaRef.current;

    if (!element) return;

    const getDistance = (first: Touch, second: Touch) => {
      const dx = first.clientX - second.clientX;

      const dy = first.clientY - second.clientY;

      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        return;
      }

      pinchStartDistance.current = getDistance(
        event.touches[0],
        event.touches[1],
      );

      pinchStartScale.current = textScale;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || pinchStartDistance.current === null) {
        return;
      }

      const currentDistance = getDistance(event.touches[0], event.touches[1]);

      const ratio = currentDistance / pinchStartDistance.current;

      const newScale = clampScale(pinchStartScale.current * ratio);

      setTextScale(newScale);
    };

    const handleTouchEnd = () => {
      pinchStartDistance.current = null;
    };

    /*
      Prevent the browser from treating the two-finger
      gesture as normal page zoom.
    */
    element.style.touchAction = "pan-y";

    element.addEventListener("touchstart", handleTouchStart, { passive: true });

    element.addEventListener("touchmove", handleTouchMove, { passive: true });

    element.addEventListener("touchend", handleTouchEnd);

    element.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);

      element.removeEventListener("touchmove", handleTouchMove);

      element.removeEventListener("touchend", handleTouchEnd);

      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [textScale]);

  /* ───────────────────────────────────────────────────────────
     SEND MESSAGE
  ─────────────────────────────────────────────────────────── */

  function send() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        mine: true,
        text: trimmedMessage,
        time,
      },
    ]);

    setMessage("");

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  /* ───────────────────────────────────────────────────────────
     KEYBOARD SEND
  ─────────────────────────────────────────────────────────── */

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  /* ───────────────────────────────────────────────────────────
     UI STATE
  ─────────────────────────────────────────────────────────── */

  const percentage = `${Math.round(textScale * 100)}%`;

  const atMinimum = textScale <= SCALE_STEPS[0];

  const atMaximum = textScale >= SCALE_STEPS[SCALE_STEPS.length - 1];

  return (
    <main className="page pro-chat-page">
      {/* ─────────────────────────────────────────────────────
          PAGE HEADER
      ───────────────────────────────────────────────────── */}

      <div className="pro-chat-top">
        <div>
          <p className="eyebrow">Your support team</p>

          <h1>Messages</h1>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          CHAT LAYOUT
      ───────────────────────────────────────────────────── */}

      <section className="pro-chat-layout">
        {/* ───────────────────────────────────────────────────
            MAIN CHAT
        ─────────────────────────────────────────────────── */}

        <div
          ref={chatAreaRef}
          className="surface chat-panel pro-chat-main"
          style={
            {
              "--chat-text-scale": textScale,
              touchAction: "pan-y",
            } as React.CSSProperties
          }
        >
          {/* ───────────────────────────────────────────────
              CHAT HEADER
          ─────────────────────────────────────────────── */}

          <div className="chat-header pro-chat-header">
            <div className="pro-chat-header-left">
              <button
                type="button"
                className="pro-chat-back-btn"
                aria-label="Show conversation note"
                onClick={() => setMobileShowNote(true)}
              >
                <ChevronLeft size={18} />
              </button>

              <div
                className="avatar"
                style={{
                  width: 40,
                  height: 40,
                  background: "#dfeedd",
                  fontSize: 13,
                }}
              >
                DP
              </div>

              <div className="pro-chat-header-info">
                <h2>Dr. Demo Professional</h2>

                <span className="online">● Typically replies within a day</span>
              </div>
            </div>

            {/* ───────────────────────────────────────────
                HEADER CONTROLS
            ─────────────────────────────────────────── */}

            <div className="pro-chat-header-right">
              <div
                className="pro-text-size"
                role="group"
                aria-label="Chat text size"
              >
                <button
                  type="button"
                  className="pro-text-size-btn"
                  onClick={() => stepText(-1)}
                  disabled={atMinimum}
                  aria-label="Decrease chat text size"
                  title="Smaller text"
                >
                  <span className="pro-text-size-a">A</span>

                  <Minus size={9} strokeWidth={3} />
                </button>

                <span className="pro-text-size-pct" aria-live="polite">
                  {percentage}
                </span>

                <button
                  type="button"
                  className="pro-text-size-btn"
                  onClick={() => stepText(1)}
                  disabled={atMaximum}
                  aria-label="Increase chat text size"
                  title="Larger text"
                >
                  <span className="pro-text-size-a pro-text-size-a--lg">A</span>

                  <Plus size={9} strokeWidth={3} />
                </button>
              </div>

              <button
                type="button"
                className="btn btn-outline pro-video-btn"
                aria-label="Start video consultation"
              >
                <Video size={16} />
              </button>
            </div>
          </div>

          {/* ───────────────────────────────────────────────
              MESSAGES
          ─────────────────────────────────────────────── */}

          <div className="messages pro-messages" aria-live="polite">
            {messages.map((item, index) => (
              <div
                key={`${item.time}-${index}`}
                className={`message ${item.mine ? "mine" : ""}`}
                style={{
                  fontSize: `${textScale}rem`,
                }}
              >
                <span
                  className="message-label"
                  style={{
                    fontSize: `${Math.max(0.65, 0.68 * textScale)}rem`,
                  }}
                >
                  {item.mine ? "You" : "Dr. Demo Professional"} · {item.time}
                </span>

                <span
                  className="message-body"
                  style={{
                    fontSize: "inherit",
                    lineHeight: 1.65,
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* ───────────────────────────────────────────────
              MESSAGE COMPOSER
          ─────────────────────────────────────────────── */}

          <div className="composer pro-composer">
            <button
              type="button"
              className="pro-composer-icon"
              aria-label="Attach a file"
            >
              <Paperclip size={18} />
            </button>

            <input
              ref={inputRef}
              className="pro-composer-input"
              aria-label="Message your professional"
              placeholder="Write a message..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleInputKeyDown}
            />

            <button
              type="button"
              className="pro-send-btn"
              onClick={send}
              disabled={!message.trim()}
              aria-label="Send message"
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────
            CONVERSATION NOTE
        ───────────────────────────────────────────────── */}

        <aside
          className={`surface side-tip pro-side-tip ${
            mobileShowNote ? "pro-side-tip--open" : ""
          }`}
        >
          <div className="pro-side-tip-header">
            <h3>Conversation note</h3>

            <button
              type="button"
              className="pro-side-tip-close"
              aria-label="Close conversation note"
              onClick={() => setMobileShowNote(false)}
            >
              ✕
            </button>
          </div>

          <p className="pro-side-tip-text">
            Messages are a great place for reflections between sessions. If
            something feels urgent, please use immediate support instead of
            waiting for a reply.
          </p>

          <div className="pro-side-tip-info">
            <div className="pro-side-tip-row">
              <span className="pro-side-tip-label">Last session</span>

              <span className="pro-side-tip-value">Aug 14</span>
            </div>

            <div className="pro-side-tip-row">
              <span className="pro-side-tip-label">Next availability</span>

              <span className="pro-side-tip-value">This week</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
