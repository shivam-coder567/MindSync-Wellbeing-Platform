import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import GardenScene from "../../components/relax/GardenScene";
import GardenObjectSVG, { GARDEN_OBJECT_TYPES } from "../../components/relax/GardenObjectSVG";

type ObjectType = "stone" | "plant" | "flower";

interface GardenObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
}

const MAX_OBJECTS = 20;

const TOOLS: { type: ObjectType; label: string; desc: string }[] = [
  { type: "stone", label: "Stone", desc: "Smooth river stone" },
  { type: "plant", label: "Plant", desc: "Gentle foliage" },
  { type: "flower", label: "Flower", desc: "Soft blossom" },
];

export default function ZenGarden() {
  const [objects, setObjects] = useState<GardenObject[]>([]);
  const [selectedTool, setSelectedTool] = useState<ObjectType>("stone");

  const placeObjectAt = useCallback(
    (xPercent: number, yPercent: number) => {
      setObjects((prev) => {
        if (prev.length >= MAX_OBJECTS) return prev;
        return [...prev, { id: crypto.randomUUID(), type: selectedTool, x: Math.max(5, Math.min(95, xPercent)), y: Math.max(5, Math.min(95, yPercent)) }];
      });
    },
    [selectedTool],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      placeObjectAt(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
    },
    [placeObjectAt],
  );

  const handleCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); placeObjectAt(50, 50); }
    },
    [placeObjectAt],
  );

  function removeObject(id: string) { setObjects((prev) => prev.filter((o) => o.id !== id)); }
  function resetGarden() { setObjects([]); }

  return (
    <main className="rr-zen">
      <div className="rr-zen-bg" aria-hidden="true">
        <div className="rr-zen-mist rr-zen-mist-1" />
        <div className="rr-zen-mist rr-zen-mist-2" />
      </div>

      <Link to="/student/relax-reset" className="rr-back">
        <ArrowLeft size={15} />
        Back to Relax &amp; Reset
      </Link>

      <header className="rr-zen-header">
        <p className="rr-eyebrow">Calming space</p>
        <h1 className="rr-zen-title">Zen Garden</h1>
        <p className="rr-zen-subtitle">
          Choose an object, click the garden to place it. Click an object to remove it.
        </p>
      </header>

      <div className="rr-zen-layout">
        {/* Garden canvas with illustrated landscape */}
        <div
          className="rr-zen-canvas"
          onClick={handleCanvasClick}
          onKeyDown={handleCanvasKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Zen garden canvas. Click or press Enter to place an object."
        >
          {/* Full illustrated landscape background */}
          <GardenScene />

          {/* Placed objects with depth-based scaling */}
          {objects.map((obj) => {
            const depthScale = 0.75 + (obj.y / 100) * 0.5;
            return (
              <button
                key={obj.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
                className="rr-zen-object"
                aria-label={`Remove ${obj.type}`}
                title={`Click to remove ${obj.type}`}
                style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
              >
                <GardenObjectSVG type={obj.type} scale={depthScale} />
              </button>
            );
          })}

          <div className="rr-zen-count">{objects.length}/{MAX_OBJECTS}</div>
        </div>

        {/* Tool palette */}
        <aside className="rr-zen-tools">
          <div className="rr-zen-tools-card">
            <p className="rr-zen-tools-label">Objects</p>
            <div className="rr-zen-tool-list">
              {TOOLS.map(({ type, label, desc }) => (
                <button key={type} type="button" onClick={() => setSelectedTool(type)} className={`rr-zen-tool${selectedTool === type ? " active" : ""}`}>
                  <span className="rr-zen-tool-icon"><GardenObjectSVG type={type} scale={0.7} /></span>
                  <span className="rr-zen-tool-text"><strong>{label}</strong><small>{desc}</small></span>
                </button>
              ))}
            </div>
            <button className="rr-btn rr-btn-ghost rr-btn-full" onClick={resetGarden} disabled={objects.length === 0}>
              <RefreshCcw size={14} />Reset garden
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
