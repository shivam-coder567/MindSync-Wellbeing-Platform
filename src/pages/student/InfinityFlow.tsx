import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import HexBoard from "../../components/relax/infinity/HexBoard";
import LevelPicker from "../../components/relax/infinity/LevelPicker";
import { LEVEL_DATA, scrambleLevel, isSolved } from "../../components/relax/infinity/hexLogic";
import { rotateMask } from "../../components/relax/infinity/hexTypes";
import { getThemeForLevel } from "../../components/relax/infinity/infinityThemes";

const SESSION_KEY = "mindsync-infinity-hex";
const MAX_HISTORY = 100;
const TOTAL_LEVELS = LEVEL_DATA.length;

interface TileState {
  hex: { q: number; r: number };
  currentMask: number;
  solvedMask: number;
  rotation: number;
}

interface HistoryEntry {
  tiles: TileState[];
}

interface SessionData {
  level: number;
  tiles: TileState[];
  completed: number[];
  history: HistoryEntry[];
  redoStack: HistoryEntry[];
}

function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveSession(data: SessionData) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function createLevel(levelId: number): TileState[] {
  const data = LEVEL_DATA[levelId - 1] || LEVEL_DATA[0];
  return scrambleLevel(data.tiles, levelId).map((t) => ({
    hex: { q: t.q, r: t.r },
    currentMask: t.currentMask,
    solvedMask: t.solvedMask,
    rotation: t.rotation,
  }));
}

export default function InfinityFlow() {
  const [level, setLevel] = useState(1);
  const [tiles, setTiles] = useState<TileState[]>(() => createLevel(1));
  const [completed, setCompleted] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [solved, setSolved] = useState(false);
  const [justSolved, setJustSolved] = useState(false);
  const stateRef = useRef({ level, tiles, completed, history, redoStack });

  // Keep ref current
  stateRef.current = { level, tiles, completed, history, redoStack };

  // Restore session
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setLevel(saved.level);
      setTiles(saved.tiles);
      setCompleted(saved.completed);
      setHistory(saved.history);
      setRedoStack(saved.redoStack);
      if (isSolved(saved.tiles)) {
        setSolved(true);
        setJustSolved(true);
        setTimeout(() => setJustSolved(false), 1500);
      }
    }
  }, []);

  // Save session
  useEffect(() => {
    saveSession({ level, tiles, completed, history, redoStack });
  }, [level, tiles, completed, history, redoStack]);

  const theme = useMemo(() => getThemeForLevel(level), [level]);

  const pushHistory = useCallback(() => {
    const entry: HistoryEntry = { tiles: stateRef.current.tiles.map((t) => ({ ...t })) };
    setHistory((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, []);

  const handleRotate = useCallback((q: number, r: number) => {
    if (solved) return;

    pushHistory();

    setTiles((prev) => {
      const next = prev.map((t) => {
        if (t.hex.q !== q || t.hex.r !== r) return t;
        const newRotation = (t.rotation + 1) % 6;
        return {
          ...t,
          rotation: newRotation,
          currentMask: rotateMask(t.solvedMask, newRotation),
        };
      });

      if (isSolved(next)) {
        setSolved(true);
        setJustSolved(true);
        setTimeout(() => setJustSolved(false), 2000);
        setCompleted((prev) => {
          const s = stateRef.current;
          if (!prev.includes(s.level)) return [...prev, s.level];
          return prev;
        });
      }

      return next;
    });
  }, [solved, pushHistory]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || solved) return;
    const entry = history[history.length - 1];
    const currentEntry: HistoryEntry = { tiles: stateRef.current.tiles.map((t) => ({ ...t })) };
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, currentEntry]);
    setTiles(entry.tiles);
    setSolved(false);
  }, [history, solved]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || solved) return;
    const entry = redoStack[redoStack.length - 1];
    const currentEntry: HistoryEntry = { tiles: stateRef.current.tiles.map((t) => ({ ...t })) };
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [...prev, currentEntry]);
    setTiles(entry.tiles);
    if (isSolved(entry.tiles)) {
      setSolved(true);
      setJustSolved(true);
      setTimeout(() => setJustSolved(false), 2000);
    }
  }, [redoStack, solved]);

  const handleReset = useCallback(() => {
    pushHistory();
    const fresh = createLevel(level);
    setTiles(fresh);
    setSolved(false);
    setJustSolved(false);
  }, [level, pushHistory]);

  const handleNextLevel = useCallback(() => {
    const next = Math.min(level + 1, TOTAL_LEVELS);
    setLevel(next);
    setTiles(createLevel(next));
    setHistory([]);
    setRedoStack([]);
    setSolved(false);
    setJustSolved(false);
  }, [level]);

  const handleSelectLevel = useCallback((lvl: number) => {
    setLevel(lvl);
    setTiles(createLevel(lvl));
    setHistory([]);
    setRedoStack([]);
    setSolved(false);
    setJustSolved(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "r" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
        handleReset();
      }
      if (e.key === "Escape") {
        setShowPicker(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, handleReset]);

  const levelName = level <= 5 ? "Easy" : level <= 10 ? "Relaxed" : level <= 20 ? "Flow" : level <= 30 ? "Focus" : "Deep Flow";
  const canUndo = history.length > 0 && !solved;
  const canRedo = redoStack.length > 0 && !solved;

  return (
    <div
      className="hex-sanctuary"
      style={{
        "--hex-bg": theme.bg,
        "--hex-surface": theme.surface,
        "--hex-line": theme.line,
        "--hex-glow": theme.glow,
        "--hex-text": theme.text,
        "--hex-text-muted": theme.textMuted,
        "--hex-accent": theme.accent,
      } as React.CSSProperties}
    >
      {/* Top bar */}
      <div className="hex-topbar">
        <Link to="/student/relax-reset" className="hex-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Relax &amp; Reset
        </Link>

        <div className="hex-level-info">
          <button className="hex-level-btn-small" onClick={() => setShowPicker(true)}>
            <span className="hex-level-label">Level</span>
            <span className="hex-level-number">{String(level).padStart(2, "0")}</span>
            <span className="hex-level-count">/ {TOTAL_LEVELS}</span>
          </button>
          <span className="hex-level-name">{levelName}</span>
        </div>

        <button className="hex-btn-small" onClick={handleReset} aria-label="Reset level">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Board */}
      <div className={`hex-board-area ${solved ? "hex-board-solved" : ""} ${justSolved ? "hex-board-just-solved" : ""}`}>
        <HexBoard
          tiles={tiles}
          theme={theme}
          onRotate={handleRotate}
          solved={solved}
        />
      </div>

      {/* Completion overlay */}
      {solved && (
        <div className="hex-completion" style={{ background: `${theme.bg}ee` }}>
          <div className="hex-completion-content">
            <p className="hex-completion-eyebrow" style={{ color: theme.accent }}>Loop complete</p>
            <h2 className="hex-completion-title" style={{ color: theme.text }}>Beautifully connected.</h2>
            <div className="hex-completion-actions">
              {level < TOTAL_LEVELS && (
                <button className="hex-btn hex-btn-primary" onClick={handleNextLevel}>
                  Next level →
                </button>
              )}
              <button className="hex-btn" onClick={handleReset}>
                Replay
              </button>
              <button className="hex-btn" onClick={() => setShowPicker(true)}>
                Level map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="hex-bottom">
        <button className="hex-btn" onClick={handleUndo} disabled={!canUndo} aria-label="Undo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          Undo
        </button>
        <button className="hex-btn" onClick={handleRedo} disabled={!canRedo} aria-label="Redo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
          Redo
        </button>
      </div>

      {/* Level picker */}
      {showPicker && (
        <LevelPicker
          currentLevel={level}
          totalLevels={TOTAL_LEVELS}
          completed={completed}
          onSelect={handleSelectLevel}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
