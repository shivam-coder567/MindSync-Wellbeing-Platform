import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import InfinityBoard from "../../components/relax/InfinityBoard";
import {
  generatePuzzle,
  rotateTile as applyRotation,
  isSolved,
  findHintTile,
  type Puzzle,
  type Difficulty,
  DIFFICULTY_CONFIG,
  getNextDifficulty,
} from "../../components/relax/infinityPuzzle";

const SESSION_KEY = "mindsync-infinity-flow";

interface SessionState {
  puzzle: Puzzle;
  difficulty: Difficulty;
  history: Puzzle[];
  completed: boolean;
  hintedTile: { row: number; col: number } | null;
}

function saveSession(state: SessionState | null) {
  try {
    if (state) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch { /* ignore */ }
}

function loadSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const MAX_HISTORY = 100;

export default function InfinityFlow() {
  const [difficulty, setDifficulty] = useState<Difficulty>("quiet");
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(4));
  const [history, setHistory] = useState<Puzzle[]>([]);
  const [completed, setCompleted] = useState(false);
  const [hintedTile, setHintedTile] = useState<{ row: number; col: number } | null>(null);
  const [pulseActive, setPulseActive] = useState(false);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Try to restore session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved && !saved.completed) {
      setPuzzle(saved.puzzle);
      setDifficulty(saved.difficulty);
      setHistory(saved.history);
      setCompleted(saved.completed);
      setHintedTile(saved.hintedTile);
    }
  }, []);

  // Save session on changes
  useEffect(() => {
    saveSession({
      puzzle,
      difficulty,
      history,
      completed,
      hintedTile,
    });
  }, [puzzle, difficulty, history, completed, hintedTile]);

  // Cleanup hint timeout
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  const handleRotate = useCallback(
    (row: number, col: number) => {
      if (completed) return;

      // Clear hint
      setHintedTile(null);

      setPuzzle((prev) => {
        const next = applyRotation(prev, row, col);

        // Check if solved
        if (isSolved(next)) {
          setCompleted(true);
          setPulseActive(true);
          setTimeout(() => setPulseActive(false), 1500);
          saveSession(null); // Clear session on completion
        }

        return next;
      });

      setHistory((prev) => {
        const next = [...prev, puzzle];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
    },
    [completed, puzzle]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || completed) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setPuzzle(prev);
    setHintedTile(null);
  }, [history, completed]);

  const handleReset = useCallback(() => {
    const fresh = generatePuzzle(DIFFICULTY_CONFIG[difficulty].size);
    setPuzzle(fresh);
    setHistory([]);
    setCompleted(false);
    setHintedTile(null);
    setPulseActive(false);
  }, [difficulty]);

  const handleHint = useCallback(() => {
    if (completed) return;
    const hint = findHintTile(puzzle);
    if (!hint) return;

    setHintedTile(hint);

    // Auto-rotate the hinted tile toward its solution after a short delay
    setTimeout(() => {
      setPuzzle((prev) => {
        const tile = prev.tiles[hint.row][hint.col];
        if (tile.connections === tile.solvedConnections) return prev;
        const next = applyRotation(prev, hint.row, hint.col);
        if (isSolved(next)) {
          setCompleted(true);
          setPulseActive(true);
          setTimeout(() => setPulseActive(false), 1500);
          saveSession(null);
        }
        return next;
      });
    }, 350);

    // Clear hint highlight after animation
    hintTimeoutRef.current = setTimeout(() => setHintedTile(null), 1200);
  }, [puzzle, completed]);

  const handleNext = useCallback(() => {
    const nextDiff = getNextDifficulty(difficulty);
    setDifficulty(nextDiff);
    const fresh = generatePuzzle(DIFFICULTY_CONFIG[nextDiff].size);
    setPuzzle(fresh);
    setHistory([]);
    setCompleted(false);
    setHintedTile(null);
    setPulseActive(false);
  }, [difficulty]);

  const config = DIFFICULTY_CONFIG[difficulty];

  // Count connected tiles
  const connectedCount = useMemo(() => {
    let count = 0;
    for (const row of puzzle.tiles) {
      for (const tile of row) {
        if (tile.connections === tile.solvedConnections) count++;
      }
    }
    return count;
  }, [puzzle]);

  const totalTiles = puzzle.size * puzzle.size;

  return (
    <div className="inf-sanctuary">
      {/* Atmospheric background */}
      <div className="inf-atmosphere" aria-hidden="true">
        <div className="inf-depth" />
        <div className="inf-light inf-light-1" />
        <div className="inf-light inf-light-2" />
        <div className="inf-botanicals">
          <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", position: "absolute", inset: 0, opacity: 0.04 }}>
            <path d="M 0 700 Q 80 620 40 540 Q 10 480 60 400 Q 30 340 70 280" stroke="#8cbfa5" strokeWidth="1.5" fill="none" />
            <path d="M 1200 650 Q 1120 580 1160 500 Q 1130 430 1170 360 Q 1140 300 1180 240" stroke="#8cbfa5" strokeWidth="1.5" fill="none" />
            <path d="M 50 750 Q 90 700 70 650 Q 100 600 80 550" stroke="#7eb39e" strokeWidth="1" fill="none" />
            <path d="M 1150 720 Q 1110 670 1130 620 Q 1100 570 1120 520" stroke="#7eb39e" strokeWidth="1" fill="none" />
          </svg>
        </div>
        {/* Particles */}
        <div className="inf-particles" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="inf-particle"
              style={{
                "--px": `${10 + (i * 17) % 80}%`,
                "--py": `${8 + (i * 23) % 84}%`,
                "--po": 0.12 + (i % 3) * 0.06,
                "--pd": `${14 + (i % 5) * 3}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Back button */}
      <Link to="/student/relax-reset" className="inf-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
        </svg>
        Back to Relax &amp; Reset
      </Link>

      {/* Centered stage */}
      <div className="inf-stage">
        {/* Header */}
        <div className="inf-header">
          <p className="inf-eyebrow">INFINITY FLOW</p>
          <h1 className="inf-title">Find the connection.</h1>
          <p className="inf-subtitle">
            Rotate the pieces until everything flows together.
          </p>
        </div>

        {/* Board */}
        <div className={`inf-board-wrap ${pulseActive ? "inf-pulse" : ""}`}>
          <InfinityBoard
            puzzle={puzzle}
            hintedTile={hintedTile}
            onRotate={handleRotate}
          />
        </div>

        {/* Progress */}
        <div className="inf-progress">
          <span className="inf-progress-text">
            {completed
              ? "Complete"
              : `${connectedCount} / ${totalTiles} aligned`}
          </span>
          <span className="inf-difficulty-label">{config.label}</span>
        </div>

        {/* Controls */}
        <div className="inf-controls">
          <button
            className="inf-btn"
            onClick={handleUndo}
            disabled={history.length === 0 || completed}
            aria-label="Undo last rotation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            Undo
          </button>
          <button
            className="inf-btn"
            onClick={handleReset}
            aria-label="Reset puzzle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
          <button
            className="inf-btn"
            onClick={handleHint}
            disabled={completed}
            aria-label="Get a hint"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            Hint
          </button>
        </div>
      </div>

      {/* Completion overlay */}
      {completed && (
        <div className="inf-completion-overlay">
          <div className="inf-completion-content">
            <p className="inf-completion-eyebrow">FLOW COMPLETE</p>
            <h2 className="inf-completion-title">You found your way through.</h2>
            <div className="inf-completion-actions">
              <button className="inf-btn inf-btn-primary" onClick={handleNext}>
                Next Flow
              </button>
              <Link to="/student/relax-reset" className="inf-btn">
                Back to Relax &amp; Reset
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
