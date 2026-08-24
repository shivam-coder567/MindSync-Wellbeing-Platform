import { memo, useCallback, useRef, useState } from "react";
import type { PlacedObject, RakeStroke, ToolType } from "./zenTypes";
import { ALL_OBJECTS } from "./zenAssets";
import ZenObject from "./ZenObject";
import ZenRakePattern from "./ZenRakePattern";

interface ZenGardenCanvasProps {
  objects: PlacedObject[];
  rakeStrokes: RakeStroke[];
  activeTool: ToolType;
  selectedObjectId: string | null;
  selectedDefId: string | null;
  onSelectObject: (id: string | null) => void;
  onPlaceObject: (defId: string, x: number, y: number) => void;
  onMoveObject: (id: string, x: number, y: number) => void;
  onRotateObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (id: string) => void;
  onAddStroke: (stroke: RakeStroke) => void;
}

const ZenGardenCanvas = memo(function ZenGardenCanvas({
  objects,
  rakeStrokes,
  activeTool,
  selectedObjectId,
  selectedDefId,
  onSelectObject,
  onPlaceObject,
  onMoveObject,
  onRotateObject,
  onDeleteObject,
  onDuplicateObject,
  onAddStroke,
}: ZenGardenCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  const isRake = activeTool === "rake";

  const getPercent = useCallback((e: React.PointerEvent | PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isRake) {
        e.preventDefault();
        setDrawing(true);
        const p = getPercent(e);
        setCurrentStroke([p]);
        return;
      }

      // If we have a selected defId, place object
      if (selectedDefId) {
        const p = getPercent(e);
        onPlaceObject(selectedDefId, p.x, p.y);
        return;
      }

      // Deselect
      onSelectObject(null);
    },
    [isRake, selectedDefId, getPercent, onPlaceObject, onSelectObject]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing || !isRake) return;
      const p = getPercent(e);
      setCurrentStroke((prev) => {
        // Simplify — skip if too close to last point
        const last = prev[prev.length - 1];
        if (last) {
          const dx = p.x - last.x;
          const dy = p.y - last.y;
          if (dx * dx + dy * dy < 0.04) return prev;
        }
        return [...prev, p];
      });
    },
    [drawing, isRake, getPercent]
  );

  const handlePointerUp = useCallback(() => {
    if (drawing && isRake && currentStroke.length >= 2) {
      onAddStroke({
        id: crypto.randomUUID(),
        points: currentStroke,
        width: 3,
      });
    }
    setDrawing(false);
    setCurrentStroke([]);
  }, [drawing, isRake, currentStroke, onAddStroke]);

  return (
    <div
      ref={canvasRef}
      className={`zen-canvas ${isRake ? "zen-canvas-rake" : ""} ${selectedDefId ? "zen-canvas-placing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="application"
      aria-label="Zen garden canvas"
    >
      {/* Sand background */}
      <div className="zen-sand" aria-hidden="true">
        <svg className="zen-sand-texture" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="sand-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="42" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
              <feBlend in="SourceGraphic" in2="grey" mode="multiply" />
            </filter>
            <radialGradient id="sand-light" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="rgba(240,230,210,0.15)" />
              <stop offset="100%" stopColor="rgba(200,185,160,0.05)" />
            </radialGradient>
          </defs>
          {/* Base sand color */}
          <rect width="800" height="600" fill="#ddd0b8" />
          {/* Subtle grain texture */}
          <rect width="800" height="600" fill="#d8cab0" filter="url(#sand-grain)" opacity="0.4" />
          {/* Light variation */}
          <rect width="800" height="600" fill="url(#sand-light)" />
        </svg>
      </div>

      {/* Rake strokes layer */}
      <ZenRakePattern strokes={rakeStrokes} />

      {/* Current rake stroke being drawn */}
      {drawing && currentStroke.length >= 2 && (
        <svg className="zen-rake-layer zen-rake-current" aria-hidden="true">
          <path
            d={currentStroke.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x}% ${p.y}%`).join(" ")}
            stroke="rgba(190,170,130,0.4)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* Placed objects */}
      {objects.map((obj) => (
        <ZenObject
          key={obj.id}
          obj={obj}
          isSelected={selectedObjectId === obj.id}
          onSelect={onSelectObject}
          onMove={onMoveObject}
          onRotate={onRotateObject}
          onDelete={onDeleteObject}
          onDuplicate={onDuplicateObject}
        />
      ))}
    </div>
  );
});

export default ZenGardenCanvas;
