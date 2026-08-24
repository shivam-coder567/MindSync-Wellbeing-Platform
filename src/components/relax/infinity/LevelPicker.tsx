import { memo } from "react";
import { THEMES, getThemeForLevel } from "./infinityThemes";

interface LevelPickerProps {
  currentLevel: number;
  totalLevels: number;
  completed: number[];
  onSelect: (level: number) => void;
  onClose: () => void;
}

const LevelPicker = memo(function LevelPicker({
  currentLevel,
  totalLevels,
  completed,
  onSelect,
  onClose,
}: LevelPickerProps) {
  return (
    <div className="hex-modal-overlay" onClick={onClose}>
      <div className="hex-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="hex-modal-title">Choose a Level</h3>
        <p className="hex-modal-sub">Find the flow in each pattern</p>
        <div className="hex-level-grid">
          {Array.from({ length: totalLevels }, (_, i) => i + 1).map((lvl) => {
            const theme = getThemeForLevel(lvl);
            const isCompleted = completed.includes(lvl);
            const isCurrent = lvl === currentLevel;
            return (
              <button
                key={lvl}
                className={`hex-level-btn ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                onClick={() => { onSelect(lvl); onClose(); }}
                style={{
                  "--lvl-bg": theme.surface,
                  "--lvl-line": theme.line,
                  "--lvl-glow": theme.glow,
                } as React.CSSProperties}
              >
                <span className="hex-level-num">{String(lvl).padStart(2, "0")}</span>
                {isCompleted && <span className="hex-level-check">✓</span>}
              </button>
            );
          })}
        </div>
        <button className="hex-btn hex-modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
});

export default LevelPicker;
