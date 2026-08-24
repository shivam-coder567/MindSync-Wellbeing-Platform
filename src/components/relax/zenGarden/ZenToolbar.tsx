import { memo, useMemo } from "react";
import type { GardenCategory, GardenObjectDef, ToolType } from "./zenTypes";
import { ALL_OBJECTS, CATEGORIES } from "./zenAssets";

interface ZenToolbarProps {
  activeTool: ToolType;
  activeCategory: GardenCategory;
  selectedObjectId: string | null;
  onSelectCategory: (cat: GardenCategory) => void;
  onSelectObject: (defId: string) => void;
  onRakeTool: () => void;
}

const ZenToolbar = memo(function ZenToolbar({
  activeTool,
  activeCategory,
  selectedObjectId,
  onSelectCategory,
  onSelectObject,
  onRakeTool,
}: ZenToolbarProps) {
  const filteredObjects = useMemo(() => {
    if (activeCategory === "all") return ALL_OBJECTS;
    return ALL_OBJECTS.filter((o) => o.category === activeCategory);
  }, [activeCategory]);

  const isRake = activeTool === "rake";

  return (
    <div className="zen-toolbar">
      {/* Category tabs */}
      <div className="zen-toolbar-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`zen-cat-btn ${activeCategory === cat.id && !isRake ? "active" : ""}`}
            onClick={() => onSelectCategory(cat.id as GardenCategory)}
            aria-label={cat.label}
            title={cat.label}
          >
            <span className="zen-cat-icon">{cat.icon}</span>
            <span className="zen-cat-label">{cat.label}</span>
          </button>
        ))}
        <div className="zen-cat-divider" />
        <button
          className={`zen-cat-btn ${isRake ? "active" : ""}`}
          onClick={onRakeTool}
          aria-label="Rake tool"
          title="Rake the sand"
        >
          <span className="zen-cat-icon">〰</span>
          <span className="zen-cat-label">Rake</span>
        </button>
      </div>

      {/* Object thumbnails */}
      {!isRake && (
        <div className="zen-toolbar-objects">
          {filteredObjects.map((obj) => (
            <button
              key={obj.id}
              className={`zen-thumb ${selectedObjectId === obj.id ? "active" : ""}`}
              onClick={() => onSelectObject(obj.id)}
              aria-label={`Place ${obj.name}`}
              title={obj.name}
            >
              <div className="zen-thumb-svg">
                {obj.render(32)}
              </div>
              <span className="zen-thumb-name">{obj.name}</span>
            </button>
          ))}
        </div>
      )}

      {isRake && (
        <div className="zen-toolbar-objects">
          <div className="zen-rake-hint">
            Drag across the sand to create rake patterns
          </div>
        </div>
      )}
    </div>
  );
});

export default ZenToolbar;
