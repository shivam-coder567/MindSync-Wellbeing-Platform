import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ZenGardenCanvas from "../../components/relax/zenGarden/ZenGardenCanvas";
import ZenToolbar from "../../components/relax/zenGarden/ZenToolbar";
import type { PlacedObject, RakeStroke, GardenCategory, ToolType, HistoryEntry, Preset } from "../../components/relax/zenGarden/zenTypes";

const SESSION_KEY = "mindsync-zen-garden";
const MAX_HISTORY = 80;

const PRESETS: Preset[] = [
  {
    name: "Quiet Morning",
    description: "Simple stones and soft petals",
    objects: [
      { defId: "stone-grey", x: 35, y: 40, rotation: 0, scale: 1.3 },
      { defId: "stone-dark", x: 60, y: 55, rotation: 15, scale: 1.1 },
      { defId: "pebble-grey", x: 45, y: 65, rotation: 0, scale: 1 },
      { defId: "petal-pink", x: 55, y: 35, rotation: -20, scale: 1 },
      { defId: "petal-white", x: 42, y: 50, rotation: 30, scale: 0.9 },
    ],
  },
  {
    name: "Soft Bloom",
    description: "Flowers and gentle greenery",
    objects: [
      { defId: "flower-daisy", x: 40, y: 35, rotation: 0, scale: 1.1 },
      { defId: "flower-pink", x: 55, y: 45, rotation: 10, scale: 1 },
      { defId: "flower-white", x: 30, y: 55, rotation: -5, scale: 0.9 },
      { defId: "plant-grass", x: 20, y: 40, rotation: 0, scale: 1.2 },
      { defId: "moss-clump", x: 65, y: 30, rotation: 0, scale: 1 },
      { defId: "pebble-white", x: 50, y: 60, rotation: 0, scale: 0.8 },
    ],
  },
  {
    name: "Stone & Water",
    description: "Stones around a peaceful pond",
    objects: [
      { defId: "pond", x: 50, y: 45, rotation: 0, scale: 1.4 },
      { defId: "stone-grey", x: 30, y: 35, rotation: 10, scale: 1.2 },
      { defId: "stone-dark", x: 70, y: 40, rotation: -15, scale: 1.1 },
      { defId: "pebble-grey", x: 35, y: 55, rotation: 0, scale: 0.9 },
      { defId: "pebble-dark", x: 65, y: 55, rotation: 20, scale: 0.8 },
      { defId: "bridge", x: 50, y: 35, rotation: 0, scale: 1 },
    ],
  },
  {
    name: "Cherry Garden",
    description: "Blossoms and serene stones",
    objects: [
      { defId: "flower-cherry", x: 35, y: 30, rotation: 0, scale: 1.3 },
      { defId: "flower-cherry", x: 55, y: 25, rotation: 15, scale: 1.1 },
      { defId: "flower-pink", x: 45, y: 50, rotation: 0, scale: 1 },
      { defId: "petal-pink", x: 40, y: 40, rotation: -25, scale: 0.9 },
      { defId: "petal-pink", x: 50, y: 35, rotation: 10, scale: 0.8 },
      { defId: "stone-grey", x: 60, y: 60, rotation: 0, scale: 1.2 },
      { defId: "moss-round", x: 30, y: 55, rotation: 0, scale: 1 },
    ],
  },
  {
    name: "Minimal",
    description: "One stone, one flower",
    objects: [
      { defId: "stone-grey", x: 45, y: 45, rotation: 0, scale: 1.4 },
      { defId: "flower-daisy", x: 55, y: 55, rotation: 0, scale: 1 },
    ],
  },
  {
    name: "Moon Garden",
    description: "White stones, silver petals, moonlight",
    objects: [
      { defId: "stone-white", x: 40, y: 40, rotation: 0, scale: 1.3 },
      { defId: "stone-white", x: 55, y: 50, rotation: 10, scale: 1 },
      { defId: "pebble-white", x: 48, y: 55, rotation: 0, scale: 0.9 },
      { defId: "flower-white", x: 35, y: 50, rotation: 0, scale: 1 },
      { defId: "petal-white", x: 50, y: 35, rotation: 20, scale: 0.8 },
      { defId: "petal-white", x: 42, y: 60, rotation: -15, scale: 0.7 },
      { defId: "lantern", x: 60, y: 35, rotation: 0, scale: 1 },
    ],
  },
];

function loadSession(): { objects: PlacedObject[]; rakeStrokes: RakeStroke[] } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(objects: PlacedObject[], rakeStrokes: RakeStroke[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ objects, rakeStrokes }));
  } catch { /* ignore */ }
}

export default function ZenGarden() {
  const [objects, setObjects] = useState<PlacedObject[]>([]);
  const [rakeStrokes, setRakeStrokes] = useState<RakeStroke[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>("all");
  const [activeCategory, setActiveCategory] = useState<GardenCategory>("all");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const historyRef = useRef({ history, redoStack });
  historyRef.current = { history, redoStack };

  // Restore session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setObjects(saved.objects);
      setRakeStrokes(saved.rakeStrokes);
    }
  }, []);

  // Save session on changes
  useEffect(() => {
    saveSession(objects, rakeStrokes);
  }, [objects, rakeStrokes]);

  const pushHistory = useCallback((newObjects: PlacedObject[], newStrokes: RakeStroke[]) => {
    const entry: HistoryEntry = {
      objects: [...objects],
      rakeStrokes: [...rakeStrokes],
    };
    setHistory((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
    setRedoStack([]);
  }, [objects, rakeStrokes]);

  const handleUndo = useCallback(() => {
    const h = historyRef.current;
    if (h.history.length === 0) return;
    const entry = h.history[h.history.length - 1];
    const currentEntry: HistoryEntry = { objects: [...objects], rakeStrokes: [...rakeStrokes] };
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, currentEntry]);
    setObjects(entry.objects);
    setRakeStrokes(entry.rakeStrokes);
  }, [objects, rakeStrokes]);

  const handleRedo = useCallback(() => {
    const h = historyRef.current;
    if (h.redoStack.length === 0) return;
    const entry = h.redoStack[h.redoStack.length - 1];
    const currentEntry: HistoryEntry = { objects: [...objects], rakeStrokes: [...rakeStrokes] };
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [...prev, currentEntry]);
    setObjects(entry.objects);
    setRakeStrokes(entry.rakeStrokes);
  }, [objects, rakeStrokes]);

  const handlePlaceObject = useCallback((defId: string, x: number, y: number) => {
    pushHistory(objects, rakeStrokes);
    const newObj: PlacedObject = {
      id: crypto.randomUUID(),
      defId,
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
      rotation: 0,
      scale: 1,
    };
    setObjects((prev) => [...prev, newObj]);
    setSelectedObjectId(newObj.id);
  }, [objects, rakeStrokes, pushHistory]);

  const handleMoveObject = useCallback((id: string, x: number, y: number) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
  }, []);

  const handleRotateObject = useCallback((id: string) => {
    pushHistory(objects, rakeStrokes);
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, rotation: (o.rotation + 45) % 360 } : o)));
  }, [objects, rakeStrokes, pushHistory]);

  const handleDeleteObject = useCallback((id: string) => {
    pushHistory(objects, rakeStrokes);
    setObjects((prev) => prev.filter((o) => o.id !== id));
    setSelectedObjectId((sel) => (sel === id ? null : sel));
  }, [objects, rakeStrokes, pushHistory]);

  const handleDuplicateObject = useCallback((id: string) => {
    pushHistory(objects, rakeStrokes);
    setObjects((prev) => {
      const orig = prev.find((o) => o.id === id);
      if (!orig) return prev;
      const dup: PlacedObject = {
        ...orig,
        id: crypto.randomUUID(),
        x: Math.min(98, orig.x + 5),
        y: Math.min(98, orig.y + 5),
      };
      return [...prev, dup];
    });
  }, [objects, rakeStrokes, pushHistory]);

  const handleAddStroke = useCallback((stroke: RakeStroke) => {
    pushHistory(objects, rakeStrokes);
    setRakeStrokes((prev) => [...prev, stroke]);
  }, [objects, rakeStrokes, pushHistory]);

  const handleSelectObject = useCallback((id: string | null) => {
    setSelectedObjectId(id);
    if (id) setSelectedDefId(null);
  }, []);

  const handleSelectDefId = useCallback((defId: string) => {
    setSelectedDefId((prev) => (prev === defId ? null : defId));
    setSelectedObjectId(null);
    setActiveTool(defId as ToolType);
  }, []);

  const handleRakeTool = useCallback(() => {
    setActiveTool("rake");
    setSelectedDefId(null);
    setSelectedObjectId(null);
  }, []);

  const handleSelectCategory = useCallback((cat: GardenCategory) => {
    setActiveCategory(cat);
    setActiveTool(cat);
    setSelectedDefId(null);
  }, []);

  const handleClear = useCallback(() => {
    pushHistory(objects, rakeStrokes);
    setObjects([]);
    setRakeStrokes([]);
    setShowClearConfirm(false);
  }, [objects, rakeStrokes, pushHistory]);

  const handleLoadPreset = useCallback((preset: Preset) => {
    pushHistory(objects, rakeStrokes);
    const newObjects: PlacedObject[] = preset.objects.map((o) => ({
      ...o,
      id: crypto.randomUUID(),
    }));
    setObjects(newObjects);
    setRakeStrokes([]);
    setShowPresets(false);
  }, [objects, rakeStrokes, pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Escape") {
        setSelectedObjectId(null);
        setSelectedDefId(null);
        setShowClearConfirm(false);
        setShowPresets(false);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObjectId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          handleDeleteObject(selectedObjectId);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, selectedObjectId, handleDeleteObject]);

  const canUndo = history.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <div className="zen-sanctuary">
      {/* Top toolbar */}
      <ZenToolbar
        activeTool={activeTool}
        activeCategory={activeCategory}
        selectedObjectId={selectedDefId}
        onSelectCategory={handleSelectCategory}
        onSelectObject={handleSelectDefId}
        onRakeTool={handleRakeTool}
      />

      {/* Canvas */}
      <ZenGardenCanvas
        objects={objects}
        rakeStrokes={rakeStrokes}
        activeTool={activeTool}
        selectedObjectId={selectedObjectId}
        selectedDefId={selectedDefId}
        onSelectObject={handleSelectObject}
        onPlaceObject={handlePlaceObject}
        onMoveObject={handleMoveObject}
        onRotateObject={handleRotateObject}
        onDeleteObject={handleDeleteObject}
        onDuplicateObject={handleDuplicateObject}
        onAddStroke={handleAddStroke}
      />

      {/* Bottom controls */}
      <div className="zen-bottom">
        <div className="zen-bottom-left">
          <button className="zen-btn" onClick={handleUndo} disabled={!canUndo} aria-label="Undo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            Undo
            <span className="zen-btn-shortcut">Ctrl+Z</span>
          </button>
          <button className="zen-btn" onClick={handleRedo} disabled={!canRedo} aria-label="Redo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
            Redo
            <span className="zen-btn-shortcut">Ctrl+Y</span>
          </button>
        </div>

        <div className="zen-bottom-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.5 }}>
            <path d="M17 8c.7-1 1.5-2.5 1.5-4.5C18.5 1.5 17 1 16 1c-1.5 0-3 1-4 2.5C11 2 9.5 1 8 1 6.5 1 5 1.5 5 3.5 5 5.5 5.8 7 6.5 8" />
            <path d="M3.5 14c-1.5-1-2.5-3-2.5-5.5C1 5.5 3 3 5.5 2.5" />
            <path d="M20.5 14c1.5-1 2.5-3 2.5-5.5 0-3-2-5.5-4.5-6" />
            <path d="M8 22c0-5 3-8 4-9s4-4 4-9" />
          </svg>
          <div className="zen-bottom-text">
            <span className="zen-bottom-title">Create your calm.</span>
            <span className="zen-bottom-sub">Design a garden that brings you peace.</span>
          </div>
        </div>

        <div className="zen-bottom-right">
          <button className="zen-btn" onClick={() => setShowPresets((p) => !p)} aria-label="Load preset">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Presets
          </button>
          <button className="zen-btn" onClick={() => setShowClearConfirm(true)} disabled={objects.length === 0 && rakeStrokes.length === 0} aria-label="Clear garden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Presets panel */}
      {showPresets && (
        <div className="zen-modal-overlay" onClick={() => setShowPresets(false)}>
          <div className="zen-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="zen-modal-title">Choose a Preset</h3>
            <p className="zen-modal-sub">Start with a beautiful arrangement</p>
            <div className="zen-presets-grid">
              {PRESETS.map((p) => (
                <button key={p.name} className="zen-preset-card" onClick={() => handleLoadPreset(p)}>
                  <span className="zen-preset-name">{p.name}</span>
                  <span className="zen-preset-desc">{p.description}</span>
                </button>
              ))}
            </div>
            <button className="zen-btn zen-modal-close" onClick={() => setShowPresets(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="zen-modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="zen-modal zen-modal-small" onClick={(e) => e.stopPropagation()}>
            <h3 className="zen-modal-title">Clear this garden?</h3>
            <p className="zen-modal-sub">This cannot be undone (unless you undo).</p>
            <div className="zen-modal-actions">
              <button className="zen-btn" onClick={() => setShowClearConfirm(false)}>Keep garden</button>
              <button className="zen-btn zen-btn-danger" onClick={handleClear}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
