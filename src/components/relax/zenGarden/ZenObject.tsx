import { memo, useCallback, useRef, useState, useEffect } from "react";
import type { PlacedObject } from "./zenTypes";
import { ALL_OBJECTS } from "./zenAssets";

interface ZenObjectProps {
  obj: PlacedObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const ZenObject = memo(function ZenObject({
  obj,
  isSelected,
  onSelect,
  onMove,
  onRotate,
  onDelete,
  onDuplicate,
}: ZenObjectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0 });

  const def = ALL_OBJECTS.find((d) => d.id === obj.defId);
  if (!def) return null;

  const baseSize = 50 * obj.scale;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(obj.id);
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, objX: obj.x, objY: obj.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [obj.id, obj.x, obj.y, onSelect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
      const nx = Math.max(2, Math.min(98, dragStart.current.objX + dx));
      const ny = Math.max(2, Math.min(98, dragStart.current.objY + dy));
      onMove(obj.id, nx, ny);
    },
    [dragging, obj.id, onMove]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div
      ref={ref}
      className={`zen-obj ${isSelected ? "zen-obj-selected" : ""} ${dragging ? "zen-obj-dragging" : ""}`}
      style={{
        left: `${obj.x}%`,
        top: `${obj.y}%`,
        transform: `translate(-50%, -50%) rotate(${obj.rotation}deg)`,
        width: baseSize,
        height: baseSize,
        cursor: dragging ? "grabbing" : "grab",
        zIndex: isSelected ? 20 : Math.round(obj.y),
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="zen-obj-svg">
        {def.render(baseSize)}
      </div>

      {isSelected && !dragging && (
        <div className="zen-obj-controls">
          <button
            className="zen-obj-ctrl"
            onClick={(e) => { e.stopPropagation(); onRotate(obj.id); }}
            aria-label="Rotate"
            title="Rotate"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            className="zen-obj-ctrl"
            onClick={(e) => { e.stopPropagation(); onDuplicate(obj.id); }}
            aria-label="Duplicate"
            title="Duplicate"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" />
            </svg>
          </button>
          <button
            className="zen-obj-ctrl zen-obj-ctrl-delete"
            onClick={(e) => { e.stopPropagation(); onDelete(obj.id); }}
            aria-label="Delete"
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

export default ZenObject;
