/**
 * BreathingBubble — Premium immersive breathing sanctuary.
 *
 * Matches reference composition:
 * - Dark atmospheric background fills content area
 * - Back button at top-left (absolute)
 * - "TAKE A BREATH" centered above sphere
 * - Large luminous sphere centered
 * - Phase / instruction / timer below
 * - Minimal Pause / End controls
 */

import { ArrowLeft, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BreathingOrb from "../../components/relax/BreathingOrb";

/* ── Constants ───────────────────────────────────────── */

type Phase = "inhale" | "hold" | "exhale";
type Status = "idle" | "active" | "paused" | "completed";

const PHASE_DURATIONS: Record<Phase, number> = { inhale: 4, hold: 4, exhale: 4 };
const PHASE_INSTRUCTIONS: Record<Phase, string> = {
  inhale: "Breathe in slowly",
  hold: "Rest here",
  exhale: "Breathe out slowly",
};
const DURATION_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
];
const CYCLE_SECONDS = PHASE_DURATIONS.inhale + PHASE_DURATIONS.hold + PHASE_DURATIONS.exhale;
const STORAGE_KEY = "mindsync_breathing_resume";

/* ── Deterministic particles ─────────────────────────── */

const PARTICLES = [
  { x: 12, y: 18, s: 3, o: 0.30, d: 16, dl: 0 },
  { x: 88, y: 25, s: 2.5, o: 0.25, d: 13, dl: 2 },
  { x: 22, y: 68, s: 2, o: 0.20, d: 18, dl: 4 },
  { x: 75, y: 70, s: 2.8, o: 0.28, d: 14, dl: 1 },
  { x: 45, y: 22, s: 1.8, o: 0.18, d: 20, dl: 3 },
  { x: 62, y: 52, s: 2.2, o: 0.22, d: 15, dl: 5 },
  { x: 18, y: 40, s: 1.5, o: 0.16, d: 17, dl: 0.5 },
  { x: 90, y: 45, s: 3.2, o: 0.26, d: 12, dl: 3.5 },
  { x: 38, y: 80, s: 1.8, o: 0.18, d: 19, dl: 6 },
  { x: 58, y: 10, s: 1.6, o: 0.15, d: 21, dl: 1.5 },
  { x: 80, y: 35, s: 2.4, o: 0.22, d: 13, dl: 5 },
  { x: 30, y: 32, s: 1.4, o: 0.14, d: 22, dl: 2.5 },
];

/* ── sessionStorage helpers ─────────────────────────── */

interface ResumeState {
  duration: number;
  status: Status;
  elapsed: number;
  phase: Phase;
  phaseProgress: number;
  savedAt: number;
  startedAt: number;
  pausedElapsed: number;
  pausedPhase: Phase;
  pausedPhaseProgress: number;
}

function saveResume(state: ResumeState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* */ }
}
function loadResume(): ResumeState | null {
  try {
    const r = sessionStorage.getItem(STORAGE_KEY);
    return r ? (JSON.parse(r) as ResumeState) : null;
  } catch { return null; }
}
function clearResume() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* */ }
}
function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/* ── Component ──────────────────────────────────────── */

export default function BreathingBubble() {
  const [status, setStatus] = useState<Status>("idle");
  const [duration, setDuration] = useState(120);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t0Ref = useRef(0);
  const pElapsedRef = useRef(0);
  const pPhaseRef = useRef<Phase>("inhale");
  const pProgressRef = useRef(0);

  /* ── Reduced motion ─────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  /* ── Timer ──────────────────────────────────────── */
  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const el = Math.floor((now - t0Ref.current) / 1000);
    if (el >= duration) { stop(); setElapsed(duration); setStatus("completed"); setPhaseProgress(0); clearResume(); return; }
    setElapsed(el);
    const cp = el % CYCLE_SECONDS;
    let acc = 0, cur: Phase = "inhale", pe = 0;
    for (const p of ["inhale", "hold", "exhale"] as Phase[]) {
      if (cp < acc + PHASE_DURATIONS[p]) { cur = p; pe = cp - acc; break; }
      acc += PHASE_DURATIONS[p];
    }
    setPhase(cur);
    setPhaseProgress(pe / PHASE_DURATIONS[cur]);
    saveResume({ duration, status: "active", elapsed: el, phase: cur, phaseProgress: pe / PHASE_DURATIONS[cur], savedAt: Date.now(), startedAt: t0Ref.current, pausedElapsed: 0, pausedPhase: "inhale", pausedPhaseProgress: 0 });
  }, [duration, stop]);

  useEffect(() => () => stop(), [stop]);

  /* ── Restore ────────────────────────────────────── */
  useEffect(() => {
    const s = loadResume();
    if (!s || s.status === "completed") { if (s) clearResume(); return; }
    if (s.status === "active") {
      const real = Math.floor((Date.now() - s.startedAt) / 1000);
      if (real >= s.duration) { clearResume(); return; }
      setDuration(s.duration); setElapsed(real); t0Ref.current = s.startedAt; setStatus("active");
      timerRef.current = setInterval(tick, 100);
    } else if (s.status === "paused") {
      setDuration(s.duration); setElapsed(s.elapsed); setPhase(s.phase); setPhaseProgress(s.phaseProgress);
      pElapsedRef.current = s.pausedElapsed; pPhaseRef.current = s.pausedPhase; pProgressRef.current = s.pausedPhaseProgress;
      setStatus("paused");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Actions ────────────────────────────────────── */
  function begin() {
    stop(); t0Ref.current = Date.now(); pElapsedRef.current = 0; pPhaseRef.current = "inhale"; pProgressRef.current = 0;
    setElapsed(0); setPhase("inhale"); setPhaseProgress(0); setStatus("active");
    timerRef.current = setInterval(tick, 100);
    saveResume({ duration, status: "active", elapsed: 0, phase: "inhale", phaseProgress: 0, savedAt: Date.now(), startedAt: t0Ref.current, pausedElapsed: 0, pausedPhase: "inhale", pausedPhaseProgress: 0 });
  }
  function pause() {
    stop(); pElapsedRef.current = elapsed; pPhaseRef.current = phase; pProgressRef.current = phaseProgress;
    setStatus("paused");
    saveResume({ duration, status: "paused", elapsed, phase, phaseProgress, savedAt: Date.now(), startedAt: t0Ref.current, pausedElapsed: elapsed, pausedPhase: phase, pausedPhaseProgress: phaseProgress });
  }
  function resume() {
    t0Ref.current = Date.now() - pElapsedRef.current * 1000;
    setPhase(pPhaseRef.current); setPhaseProgress(pProgressRef.current); setStatus("active");
    timerRef.current = setInterval(tick, 100);
  }
  function end() {
    stop(); setStatus("idle"); setElapsed(0); setPhase("inhale"); setPhaseProgress(0); clearResume();
  }

  /* ── Orb values ─────────────────────────────────── */
  const active = status === "active" || status === "paused";
  const orbScale = active
    ? phase === "inhale" ? 0.92 + phaseProgress * 0.20
      : phase === "hold" ? 1.12
        : 1.12 - phaseProgress * 0.20
    : status === "completed" ? 0.95 : 1;
  const orbGlow = active
    ? phase === "inhale" ? 0.10 + phaseProgress * 0.40
      : phase === "hold" ? 0.50
        : 0.50 - phaseProgress * 0.40
    : status === "completed" ? 0.08 : 0.12;

  const remaining = Math.max(0, duration - elapsed);

  const savedResume = useMemo(() => {
    if (status !== "idle") return null;
    const r = loadResume();
    return r && r.status !== "completed" ? r : null;
  }, [status]);

  return (
    <div className="breath-scene">
      {/* ── Atmosphere ─────────────────────────────── */}
      <div className="breath-atmosphere" aria-hidden="true">
        <div className="breath-depth" />
        <div className="breath-light breath-light-1" />
        <div className="breath-light breath-light-2" />
        <div className="breath-light breath-light-3" />

        {/* Botanical silhouettes */}
        <svg className="breath-botanicals" viewBox="0 0 1400 800" fill="none" preserveAspectRatio="xMidYMid slice">
          {/* Left branches */}
          <g opacity="0.18">
            <path d="M-30 700 Q20 620 10 540 Q0 470 20 420 Q30 380 15 340 Q5 300 25 260 Q35 220 20 180 Q10 140 30 100" stroke="#1a4a38" strokeWidth="2" fill="none" />
            <path d="M15 420 Q50 400 65 375 Q50 365 30 380Z" fill="#1a4a38" fillOpacity="0.5" />
            <path d="M25 340 Q60 320 75 295 Q55 290 35 310Z" fill="#1a4a38" fillOpacity="0.45" />
            <path d="M20 260 Q55 245 68 220 Q50 215 30 235Z" fill="#1a4a38" fillOpacity="0.4" />
            <path d="M30 180 Q60 165 70 140 Q55 135 38 155Z" fill="#1a4a38" fillOpacity="0.35" />
          </g>
          {/* Right branches */}
          <g opacity="0.15">
            <path d="M1430 680 Q1380 600 1390 520 Q1400 450 1380 400 Q1370 360 1385 320 Q1395 280 1375 240 Q1365 200 1380 160" stroke="#1a4a38" strokeWidth="2" fill="none" />
            <path d="M1385 400 Q1350 380 1335 355 Q1350 345 1370 360Z" fill="#1a4a38" fillOpacity="0.5" />
            <path d="M1375 320 Q1340 300 1325 275 Q1345 270 1365 290Z" fill="#1a4a38" fillOpacity="0.45" />
            <path d="M1380 240 Q1345 225 1332 200 Q1350 195 1370 215Z" fill="#1a4a38" fillOpacity="0.4" />
          </g>
          {/* Bottom left foliage */}
          <g opacity="0.12">
            <path d="M80 800 Q60 740 40 680 Q20 630 50 600 Q70 580 90 610 Q100 640 85 680 Q70 730 80 800Z" fill="#1a4a38" />
            <path d="M150 800 Q130 750 120 700 Q110 660 140 640 Q160 625 170 660 Q180 700 160 750Z" fill="#1a4a38" fillOpacity="0.7" />
          </g>
          {/* Bottom right foliage */}
          <g opacity="0.10">
            <path d="M1300 800 Q1320 740 1340 680 Q1360 630 1330 600 Q1310 580 1290 610 Q1280 640 1295 680Z" fill="#1a4a38" />
            <path d="M1220 800 Q1240 750 1250 700 Q1260 660 1230 640 Q1210 625 1200 660 Q1190 700 1210 750Z" fill="#1a4a38" fillOpacity="0.7" />
          </g>
        </svg>

        {/* Particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="breath-particle"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.s, height: p.s, opacity: p.o,
              animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`,
            }}
          />
        ))}
      </div>

      {/* ── Back button (absolute, top-left of sanctuary) ── */}
      <Link to="/student/relax-reset" className="breath-back">
        <ArrowLeft size={16} />
        Back to Relax &amp; Reset
      </Link>

      {/* ── Centered content ───────────────────────── */}
      <div className="breath-stage">
        {/* "TAKE A BREATH" always visible */}
        <p className="breath-title" aria-live="polite">
          TAKE A BREATH
        </p>

        {/* The Orb */}
        <div
          className="breath-orb-wrap"
          role="img"
          aria-label={active ? "Breathing: " + phase : "Breathing orb"}
        >
          <BreathingOrb scale={orbScale} glow={orbGlow} reducedMotion={reducedMotion} />
        </div>

        {/* Phase + instruction */}
        {active && (
          <>
            <p className="breath-phase" aria-live="polite">
              {phase === "inhale" ? "INHALE" : phase === "hold" ? "HOLD" : "EXHALE"}
            </p>
            <p className="breath-instruction" aria-live="polite">
              {status === "paused" ? "Continue when you're ready." : PHASE_INSTRUCTIONS[phase]}
            </p>
          </>
        )}

        {status === "idle" && (
          <p className="breath-instruction">Choose a duration</p>
        )}

        {/* Timer — large, during active/paused */}
        {(status === "active" || status === "paused") && (
          <div className="breath-timer">
            <span className="breath-timer-time">{fmt(remaining)}</span>
            <span className="breath-timer-label">remaining</span>
          </div>
        )}

        {/* ── Controls ──────────────────────────────── */}
        <div className="breath-controls">
          {/* Idle — resume */}
          {status === "idle" && savedResume && (
            <div className="breath-resume-group">
              <p className="breath-resume-text">Continue your session</p>
              <p className="breath-resume-sub">{fmt(savedResume.duration - savedResume.elapsed)} remaining</p>
              <div className="breath-btn-row">
                <button className="breath-btn-pill" onClick={() => {
                  const s = loadResume();
                  if (s) {
                    setDuration(s.duration);
                    if (s.status === "paused") {
                      setElapsed(s.elapsed); setPhase(s.phase); setPhaseProgress(s.phaseProgress);
                      pElapsedRef.current = s.pausedElapsed; pPhaseRef.current = s.pausedPhase; pProgressRef.current = s.pausedPhaseProgress;
                      setStatus("paused");
                    }
                  }
                }} aria-label="Resume breathing session">
                  <Play size={14} /> Resume
                </button>
                <button className="breath-btn-pill breath-btn-outline" onClick={clearResume} aria-label="Start fresh">
                  Start fresh
                </button>
              </div>
            </div>
          )}

          {/* Idle — no resume */}
          {status === "idle" && !savedResume && (
            <div className="breath-setup-group">
              <div className="breath-durations">
                {DURATION_OPTIONS.map((o) => (
                  <button key={o.seconds} type="button" onClick={() => setDuration(o.seconds)}
                    className={`breath-dur-btn${duration === o.seconds ? " active" : ""}`}
                    aria-label={`${o.label} session`}>{o.label}</button>
                ))}
              </div>
              <button className="breath-btn-pill breath-btn-primary" onClick={begin} aria-label="Begin breathing session">
                Begin
              </button>
            </div>
          )}

          {/* Active */}
          {status === "active" && (
            <div className="breath-btn-row">
              <button className="breath-btn-pill" onClick={pause} aria-label="Pause breathing">
                <Pause size={14} /> Pause
              </button>
              <button className="breath-btn-pill breath-btn-outline" onClick={end} aria-label="End breathing session">
                <X size={14} /> End
              </button>
            </div>
          )}

          {/* Paused */}
          {status === "paused" && (
            <div className="breath-btn-row">
              <button className="breath-btn-pill breath-btn-primary" onClick={resume} aria-label="Resume breathing">
                <Play size={14} /> Resume
              </button>
              <button className="breath-btn-pill breath-btn-outline" onClick={end} aria-label="End breathing session">
                <X size={14} /> End
              </button>
            </div>
          )}

          {/* Completed */}
          {status === "completed" && (
            <div className="breath-complete-group">
              <p className="breath-complete-title">Beautifully done.</p>
              <p className="breath-complete-sub">Take a moment before you return.</p>
              <Link to="/student/relax-reset" className="breath-btn-pill breath-btn-outline" style={{ textDecoration: "none" }}>
                Return to Relax &amp; Reset
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
