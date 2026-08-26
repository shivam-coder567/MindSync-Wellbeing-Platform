import { useEffect, useMemo, useState } from "react";
import HexBoard from "./HexBoard";
import LevelPicker from "./LevelPicker";
import {
  countPuzzleMoves,
  getNextLevel,
  getPuzzleLevel,
  infinityLevels,
  isPuzzleSolved,
  rotatePuzzleTile,
} from "./infinityPuzzle";
import { getInfinityTheme, getInfinityThemes } from "./infinityThemes";
import "./infinity-flow.css";
export default function InfinityFlow() {
  const [levelId, setLevelId] = useState(1),
    [puzzle, setPuzzle] = useState(() => getPuzzleLevel(1)),
    [themeId, setThemeId] = useState("sage"),
    [selected, setSelected] = useState<{ q: number; r: number } | null>(null),
    [hint, setHint] = useState<{ q: number; r: number } | null>(null),
    [hints, setHints] = useState(3);
  const theme = useMemo(() => getInfinityTheme(themeId), [themeId]),
    solved = isPuzzleSolved(puzzle),
    moves = countPuzzleMoves(puzzle);
  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(null), 1800);
    return () => clearTimeout(id);
  }, [hint]);
  const load = (id: number) => {
    setLevelId(id);
    setPuzzle(getPuzzleLevel(id));
    setSelected(null);
    setHint(null);
    setHints(3);
  };
  const rotate = (q: number, r: number) => {
    setSelected({ q, r });
    setPuzzle((p) => rotatePuzzleTile(p, q, r));
  };
  const reset = () => setPuzzle(getPuzzleLevel(levelId));
  const useHint = () => {
    if (hints <= 0 || solved) return;
    const w = puzzle.tiles.find((t) => t.mask !== t.solvedMask);
    if (w) {
      setHint(w.hex);
      setSelected(w.hex);
      setHints((h) => h - 1);
    }
  };
  const next = () => {
    const n = getNextLevel(levelId);
    load(n ? n.id : 1);
  };
  return (
    <main
      className="infinity-flow"
      style={
        {
          background: theme.background,
          color: theme.text,
          "--infinity-glow": theme.glow,
        } as React.CSSProperties
      }
    >
      <div className="infinity-flow__ambient a" />
      <div className="infinity-flow__ambient b" />
      <section className="infinity-flow__game">
        <header className="infinity-flow__header">
          <div>
            <div className="infinity-flow__eyebrow">
              MINDSYNC • RELAX & RESET
            </div>
            <h1>Infinity Flow</h1>
            <p>{puzzle.subtitle}</p>
          </div>
          <div className="infinity-flow__actions">
            <div className="infinity-flow__stat">
              <strong>{moves}</strong>
              <span>moves</span>
            </div>
            <button className="infinity-flow__reset" onClick={reset}>
              Reset
            </button>
            <button
              className="infinity-flow__hint"
              disabled={!hints || solved}
              onClick={useHint}
            >
              💡<b>{hints}</b>
            </button>
          </div>
        </header>
        <div className="infinity-flow__content">
          <div className="infinity-flow__title">
            <span>FLOW {String(levelId).padStart(2, "0")}</span>
            <h2>{puzzle.name}</h2>
          </div>
          <LevelPicker
            levels={infinityLevels}
            current={levelId}
            onChange={load}
          />
          <div className="infinity-flow__board-card">
            <HexBoard
              puzzle={puzzle}
              theme={theme}
              tileSize={levelId === 1 ? 68 : 58}
              selected={selected}
              hint={hint}
              onRotate={rotate}
            />
            <div className="infinity-flow__instruction">
              ✦ Tap a tile to rotate it and connect the flow.
            </div>
          </div>
          <div className="infinity-flow__bottom">
            <div>
              <span>THEME</span>
              <div className="infinity-flow__themes">
                {getInfinityThemes().map(([id, c]) => (
                  <button
                    key={id}
                    className={id === themeId ? "is-active" : ""}
                    style={{ background: c.background, borderColor: c.glow }}
                    onClick={() => setThemeId(id)}
                    aria-label={id}
                  />
                ))}
              </div>
            </div>
            <div className="infinity-flow__breath">✧ Find your flow.</div>
          </div>
        </div>
        {solved && (
          <div className="infinity-complete">
            <div className="infinity-complete__card">
              <div className="infinity-complete__spark">✦</div>
              <span>FLOW COMPLETE</span>
              <h2>Everything is connected.</h2>
              <p>Take one slow breath before the next pattern.</p>
              <button onClick={next}>
                {levelId === 3 ? "Start again" : "Next level →"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
