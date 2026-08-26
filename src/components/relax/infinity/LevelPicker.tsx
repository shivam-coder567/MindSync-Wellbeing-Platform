import type { InfinityPuzzle } from "./hexTypes";
export default function LevelPicker({
  levels,
  current,
  onChange,
}: {
  levels: InfinityPuzzle[];
  current: number;
  onChange: (id: number) => void;
}) {
  return (
    <div className="infinity-levels">
      {levels.map((l) => (
        <button
          key={l.id}
          className={l.id === current ? "is-active" : ""}
          onClick={() => onChange(l.id)}
        >
          Level {l.id}
        </button>
      ))}
    </div>
  );
}
