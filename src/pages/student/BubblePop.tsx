/**
 * BubbleFlow — Premium immersive bubble release experience.
 *
 * Architecture:
 * - Sanctuary fills content area below global header
 * - Back button absolute top-left
 * - Centered game stage with depth layers
 * - Glass SVG bubbles with CSS-driven movement
 * - Pop effect with rings + particles
 * - sessionStorage resume
 */

import { ArrowLeft, Pause, Play, Square, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BubbleSVG from "../../components/relax/BubbleSVG";
import BubblePopEffect from "../../components/relax/BubblePopEffect";

/* ── Types ───────────────────────────────────────────── */

type Status = "idle" | "active" | "paused" | "completed";

interface Bubble {
  id: string;
  nonce: string;
  x: number;        /* % from left */
  startY: number;    /* % from bottom */
  size: number;      /* px */
  speed: number;     /* seconds for full journey */
  delay: number;     /* seconds */
  hue: number;
  drift: number;     /* horizontal sway px */
  depth: "back" | "mid" | "front";
}

interface PopEffect {
  id: string;
  x: number;
  y: number;
  size: number;
  hue: number;
}

/* ── Constants ───────────────────────────────────────── */

const SESSION_DURATION = 60;
const MAX_BUBBLES = 14;
const MIN_SPAWN_MS = 700;
const MAX_SPAWN_MS = 1200;
const HUES = [155, 168, 180, 148, 192];
const STORAGE_KEY = "mindsync_bubble_flow_resume";

/* Size bands: [min, max] */
const SIZE_BANDS: { range: [number, number]; weight: number; speed: [number, number] }[] = [
  { range: [48, 72], weight: 3, speed: [7, 11] },   /* small */
  { range: [80, 120], weight: 4, speed: [9, 14] },   /* medium */
  { range: [130, 170], weight: 2, speed: [12, 18] },  /* large */
];

const SPAWN_SAFE_ZONES = [
  /* center title area: ~40-60% x, 5-15% from top */
  { cx: 50, cy: 10, r: 18 },
  /* controls area: ~40-60% x, 82-100% from top */
  { cx: 50, cy: 90, r: 15 },
];

let bubbleCounter = 0;

function pickSize(): { size: number; speed: [number, number] } {
  const total = SIZE_BANDS.reduce((s, b) => s + b.weight, 0);
  let r = Math.random() * total;
  for (const band of SIZE_BANDS) {
    r -= band.weight;
    if (r <= 0) {
      return {
        size: band.range[0] + Math.random() * (band.range[1] - band.range[0]),
        speed: band.speed,
      };
    }
  }
  const last = SIZE_BANDS[SIZE_BANDS.length - 1];
  return { size: last.range[0], speed: last.speed };
}

function pickDepth(size: number): "back" | "mid" | "front" {
  if (size < 75) return "back";
  if (size < 130) return "mid";
  return "front";
}

function isSafePosition(x: number, y: number, existing: Bubble[]): boolean {
  /* Check safe zones */
  for (const zone of SPAWN_SAFE_ZONES) {
    const dx = x - zone.cx;
    const dy = y - zone.cy;
    if (Math.sqrt(dx * dx + dy * dy) < zone.r) return false;
  }
  /* Check minimum distance from existing bubbles */
  for (const b of existing) {
    const dx = x - b.x;
    const dy = y - b.startY;
    const minDist = (b.size + 80) / 10;
    if (Math.sqrt(dx * dx + dy * dy) < minDist) return false;
  }
  return true;
}

function createBubble(existing: Bubble[]): Bubble | null {
  const { size, speed } = pickSize();
  let x: number, y: number, attempts = 0;
  do {
    x = 8 + Math.random() * 84;
    y = -5 + Math.random() * 15;
    attempts++;
  } while (!isSafePosition(x, y, existing) && attempts < 20);

  return {
    id: `bub-${++bubbleCounter}`,
    nonce: `n${bubbleCounter}`,
    x,
    startY: y,
    size,
    speed: speed[0] + Math.random() * (speed[1] - speed[0]),
    delay: Math.random() * 0.4,
    hue: HUES[Math.floor(Math.random() * HUES.length)],
    drift: (Math.random() - 0.5) * 60,
    depth: pickDepth(size),
  };
}

/* ── Session storage ─────────────────────────────────── */

interface ResumeState {
  status: Status;
  elapsed: number;
  popped: number;
  savedAt: number;
}

function saveSession(s: ResumeState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* */ }
}
function loadSession(): ResumeState | null {
  try {
    const r = sessionStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* */ }
}

function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/* ── Component ───────────────────────────────────────── */

export default function BubbleFlow() {
  const [status, setStatus] = useState<Status>("idle");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [pops, setPops] = useState<PopEffect[]>([]);
  const [popped, setPopped] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  /* ── Reduced motion ─────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  /* ── Timers ─────────────────────────────────────── */
  const clearTimers = useCallback(() => {
    if (spawnRef.current) { clearInterval(spawnRef.current); spawnRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  /* ── Escape to pause ────────────────────────────── */
  useEffect(() => {
    if (status !== "active") return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") pauseSession(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [status]);

  /* ── Restore session ────────────────────────────── */
  useEffect(() => {
    const s = loadSession();
    if (!s || s.status === "completed") { if (s) clearSession(); return; }
    if (s.status === "active") {
      const real = Math.floor((Date.now() - s.savedAt) / 1000);
      const newElapsed = s.elapsed + real;
      if (newElapsed >= SESSION_DURATION) { clearSession(); return; }
      setElapsed(newElapsed);
      elapsedRef.current = newElapsed;
      setStatus("active");
      startSpawn();
      startTimers();
    } else if (s.status === "paused") {
      setElapsed(s.elapsed);
      elapsedRef.current = s.elapsed;
      setStatus("paused");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Spawn logic ────────────────────────────────── */
  function startSpawn() {
    /* Spawn initial burst */
    const initial: Bubble[] = [];
    for (let i = 0; i < 4; i++) {
      const b = createBubble(initial);
      if (b) initial.push(b);
    }
    setBubbles(initial);

    spawnRef.current = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length >= MAX_BUBBLES) return prev;
        const b = createBubble(prev);
        return b ? [...prev, b] : prev;
      });
    }, MIN_SPAWN_MS + Math.random() * (MAX_SPAWN_MS - MIN_SPAWN_MS));
  }

  function startTimers() {
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= SESSION_DURATION) {
        clearTimers();
        setStatus("completed");
        clearSession();
      }
    }, 1000);
  }

  /* ── Actions ────────────────────────────────────── */
  function beginSession() {
    clearTimers();
    bubbleCounter = 0;
    setBubbles([]); setPops([]); setPopped(0); setElapsed(0);
    elapsedRef.current = 0;
    setStatus("active");
    startSpawn();
    startTimers();
    saveSession({ status: "active", elapsed: 0, popped: 0, savedAt: Date.now() });
  }

  function pauseSession() {
    clearTimers();
    setStatus("paused");
    saveSession({ status: "paused", elapsed: elapsedRef.current, popped, savedAt: Date.now() });
  }

  function resumeSession() {
    setStatus("active");
    startTimers();
    /* Resume spawn if empty */
    if (bubbles.length === 0) startSpawn();
    else {
      spawnRef.current = setInterval(() => {
        setBubbles((prev) => {
          if (prev.length >= MAX_BUBBLES) return prev;
          const b = createBubble(prev);
          return b ? [...prev, b] : prev;
        });
      }, MIN_SPAWN_MS + Math.random() * (MAX_SPAWN_MS - MIN_SPAWN_MS));
    }
    saveSession({ status: "active", elapsed: elapsedRef.current, popped, savedAt: Date.now() });
  }

  function endSession() {
    clearTimers();
    setStatus("idle");
    setBubbles([]); setPops([]); setPopped(0); setElapsed(0);
    elapsedRef.current = 0;
    clearSession();
  }

  /* ── Bubble interaction ─────────────────────────── */
  function popBubble(bubble: Bubble, e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    /* Get screen position for pop effect */
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const px = rect.left + rect.width / 2;
    const py = rect.top + rect.height / 2;

    /* Remove bubble */
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    setPopped((prev) => prev + 1);

    /* Show pop effect */
    const popId = `pop-${Date.now()}-${bubble.id}`;
    setPops((prev) => [...prev, { id: popId, x: px, y: py, size: bubble.size, hue: bubble.hue }]);

    /* Save progress */
    const newPopped = popped + 1;
    saveSession({ status: "active", elapsed: elapsedRef.current, popped: newPopped, savedAt: Date.now() });
  }

  function removePop(id: string) {
    setPops((prev) => prev.filter((p) => p.id !== id));
  }

  /* ── Bubble exit (CSS animation end) ────────────── */
  function handleBubbleExit(id: string) {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }

  const remaining = Math.max(0, SESSION_DURATION - elapsed);
  const isActive = status === "active";

  /* ── Depth opacity helpers ──────────────────────── */
  const depthOpacity: Record<string, number> = { back: 0.35, mid: 0.65, front: 0.9 };
  const depthFilter: Record<string, string> = {
    back: "blur(1.5px) brightness(0.85)",
    mid: "none",
    front: "brightness(1.08)",
  };

  return (
    <div className="flow-sanctuary">
      {/* ── Atmosphere ─────────────────────────────── */}
      <div className="flow-atmosphere" aria-hidden="true">
        <div className="flow-depth-bg" />
        <div className="flow-light flow-light-1" />
        <div className="flow-light flow-light-2" />
        <div className="flow-light flow-light-3" />

        {/* Botanical silhouettes */}
        <svg className="flow-botanicals" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice">
          <g opacity="0.12">
            <path d="M-20 720 Q30 650 20 570 Q10 500 30 450 Q40 410 25 370 Q15 330 35 290 Q45 250 30 210 Q20 170 40 130" stroke="#1a4a38" strokeWidth="1.5" fill="none" />
            <path d="M30 450 Q65 430 78 405 Q60 395 40 410Z" fill="#1a4a38" fillOpacity="0.5" />
            <path d="M35 370 Q68 350 80 325 Q62 320 42 340Z" fill="#1a4a38" fillOpacity="0.4" />
          </g>
          <g opacity="0.10">
            <path d="M1420 700 Q1370 630 1380 550 Q1390 480 1370 430 Q1360 390 1375 350 Q1385 310 1365 270" stroke="#1a4a38" strokeWidth="1.5" fill="none" />
            <path d="M1375 430 Q1342 410 1328 385 Q1345 375 1365 390Z" fill="#1a4a38" fillOpacity="0.5" />
            <path d="M1365 350 Q1332 330 1320 305 Q1340 300 1358 320Z" fill="#1a4a38" fillOpacity="0.4" />
          </g>
        </svg>

        {/* Ambient particles */}
        {[
          { x: 10, y: 20, s: 2.5, o: 0.25, d: 15, dl: 0 },
          { x: 85, y: 30, s: 2, o: 0.20, d: 12, dl: 3 },
          { x: 25, y: 70, s: 1.8, o: 0.18, d: 18, dl: 5 },
          { x: 75, y: 65, s: 2.2, o: 0.22, d: 14, dl: 1.5 },
          { x: 50, y: 15, s: 1.5, o: 0.15, d: 20, dl: 4 },
          { x: 60, y: 80, s: 2, o: 0.18, d: 16, dl: 2 },
          { x: 15, y: 45, s: 1.8, o: 0.16, d: 17, dl: 6 },
          { x: 90, y: 50, s: 2.5, o: 0.22, d: 13, dl: 3.5 },
        ].map((p, i) => (
          <div
            key={i}
            className="flow-particle"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.s, height: p.s, opacity: p.o,
              animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`,
            }}
          />
        ))}
      </div>

      {/* ── Back button (absolute) ─────────────────── */}
      <Link to="/student/relax-reset" className="flow-back">
        <ArrowLeft size={16} />
        Back to Relax &amp; Reset
      </Link>

      {/* ── Centered stage ─────────────────────────── */}
      <div className="flow-stage">
        {/* Title */}
        <div className="flow-header">
          <p className="flow-title">BUBBLE FLOW</p>
          <p className="flow-subtitle">Let everything drift away.</p>
        </div>

        {/* Game area */}
        <div className="flow-game" role="region" aria-label="Bubble area">
          {/* Depth layers */}
          <div className="flow-game-depth flow-game-depth-1" />
          <div className="flow-game-depth flow-game-depth-2" />

          {/* Bubbles */}
          {bubbles.map((b) => {
            const isBack = b.depth === "back";
            const isFront = b.depth === "front";
            const depthMul = isBack ? 0.85 : isFront ? 1.15 : 1;
            return (
              <div
                key={b.id}
                className="flow-bubble-track"
                style={{
                  "--bx": `${b.x}%`,
                  "--by": `${b.startY}%`,
                  "--bdur": `${b.speed}s`,
                  "--bdelay": `${b.delay}s`,
                  "--bdrift": `${b.drift}px`,
                  "--bscale": `${depthMul}`,
                } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="flow-bubble-btn"
                  style={{
                    width: b.size,
                    height: b.size,
                    opacity: depthOpacity[b.depth],
                    filter: depthFilter[b.depth],
                  }}
                  onClick={(e) => popBubble(b, e)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") popBubble(b, e); }}
                  onAnimationEnd={() => handleBubbleExit(b.id)}
                  aria-label="Release bubble"
                >
                  <BubbleSVG hue={b.hue} size={b.size} nonce={b.nonce} />
                </button>
              </div>
            );
          })}

          {/* Idle overlay */}
          {status === "idle" && (
            <div className="flow-overlay">
              <p className="flow-overlay-hint">Press Begin to start</p>
            </div>
          )}

          {/* Paused overlay */}
          {status === "paused" && (
            <div className="flow-overlay">
              <p className="flow-overlay-phase">PAUSED</p>
              <p className="flow-overlay-hint">Take your time.</p>
            </div>
          )}

          {/* Completion overlay */}
          {status === "completed" && (
            <div className="flow-overlay">
              <p className="flow-overlay-title">Take a breath.</p>
              <p className="flow-overlay-sub">Your space is still here whenever you need it.</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flow-controls">
          {/* Idle */}
          {status === "idle" && (
            <button className="flow-btn flow-btn-primary" onClick={beginSession} aria-label="Begin bubble flow">
              <Play size={15} /> Begin
            </button>
          )}

          {/* Active */}
          {isActive && (
            <>
              <div className="flow-timer">
                <span className="flow-timer-time">{fmtTime(remaining)}</span>
                <span className="flow-timer-sub">remaining</span>
              </div>
              <div className="flow-counter">
                {popped} bubble{popped !== 1 ? "s" : ""} released
              </div>
              <div className="flow-btn-row">
                <button className="flow-btn" onClick={pauseSession} aria-label="Pause">
                  <Pause size={13} /> Pause
                </button>
                <button className="flow-btn flow-btn-outline" onClick={endSession} aria-label="End session">
                  <Square size={12} /> End
                </button>
              </div>
            </>
          )}

          {/* Paused */}
          {status === "paused" && (
            <div className="flow-btn-row">
              <button className="flow-btn flow-btn-primary" onClick={resumeSession} aria-label="Resume">
                <Play size={13} /> Resume
              </button>
              <button className="flow-btn flow-btn-outline" onClick={endSession} aria-label="End session">
                <X size={13} /> End
              </button>
            </div>
          )}

          {/* Completed */}
          {status === "completed" && (
            <div className="flow-btn-row">
              <button className="flow-btn flow-btn-primary" onClick={beginSession} aria-label="Play again">
                <Play size={13} /> Play Again
              </button>
              <Link to="/student/relax-reset" className="flow-btn flow-btn-outline" style={{ textDecoration: "none" }}>
                Return to Relax &amp; Reset
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Pop effects ────────────────────────────── */}
      {pops.map((p) => (
        <BubblePopEffect
          key={p.id}
          x={p.x}
          y={p.y}
          size={p.size}
          hue={p.hue}
          onComplete={() => removePop(p.id)}
        />
      ))}
    </div>
  );
}
