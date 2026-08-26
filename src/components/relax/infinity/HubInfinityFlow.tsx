import React, { useEffect, useMemo, useState } from "react";

type TileType = "corner" | "straight" | "t" | "cross";

type Tile = {
  type: TileType;
  correctRotation: number;
  rotation: number;
};

type Level = {
  id: number;
  width: number;
  height: number;
  grid: {
    type: TileType;
    correctRotation: number;
  }[];
};

const STORAGE_KEY = "mindSync_infinity_flow_state";

const levels: Level[] = [
  {
    id: 1,
    width: 3,
    height: 3,
    grid: [
      { type: "corner", correctRotation: 1 },
      { type: "straight", correctRotation: 1 },
      { type: "corner", correctRotation: 2 },

      { type: "straight", correctRotation: 0 },
      { type: "cross", correctRotation: 0 },
      { type: "straight", correctRotation: 0 },

      { type: "corner", correctRotation: 0 },
      { type: "straight", correctRotation: 1 },
      { type: "corner", correctRotation: 3 },
    ],
  },

  {
    id: 2,
    width: 4,
    height: 4,
    grid: [
      { type: "corner", correctRotation: 1 },
      { type: "t", correctRotation: 2 },
      { type: "t", correctRotation: 2 },
      { type: "corner", correctRotation: 2 },

      { type: "straight", correctRotation: 0 },
      { type: "corner", correctRotation: 0 },
      { type: "corner", correctRotation: 1 },
      { type: "straight", correctRotation: 0 },

      { type: "straight", correctRotation: 0 },
      { type: "corner", correctRotation: 3 },
      { type: "corner", correctRotation: 2 },
      { type: "straight", correctRotation: 0 },

      { type: "corner", correctRotation: 0 },
      { type: "t", correctRotation: 0 },
      { type: "t", correctRotation: 0 },
      { type: "corner", correctRotation: 3 },
    ],
  },

  {
    id: 3,
    width: 4,
    height: 4,
    grid: [
      { type: "corner", correctRotation: 1 },
      { type: "straight", correctRotation: 1 },
      { type: "t", correctRotation: 2 },
      { type: "corner", correctRotation: 2 },

      { type: "t", correctRotation: 1 },
      { type: "corner", correctRotation: 2 },
      { type: "straight", correctRotation: 0 },
      { type: "straight", correctRotation: 0 },

      { type: "straight", correctRotation: 0 },
      { type: "corner", correctRotation: 0 },
      { type: "t", correctRotation: 3 },
      { type: "straight", correctRotation: 0 },

      { type: "corner", correctRotation: 0 },
      { type: "straight", correctRotation: 1 },
      { type: "corner", correctRotation: 3 },
      { type: "cross", correctRotation: 0 },
    ],
  },
];

function createLevel(level: Level): Tile[] {
  return level.grid.map((tile) => ({
    ...tile,
    rotation: Math.floor(Math.random() * 4),
  }));
}

function isSolved(level: Level, tiles: Tile[]) {
  return tiles.every((tile) => tile.rotation % 4 === tile.correctRotation % 4);
}

function TileSVG({ type, rotation }: { type: TileType; rotation: number }) {
  const stroke = "#3f806c";
  const center = 50;

  const lines = useMemo(() => {
    const base: { x2: number; y2: number }[] = [];

    if (type === "straight") {
      base.push({ x2: center, y2: 10 }, { x2: center, y2: 90 });
    }

    if (type === "corner") {
      base.push({ x2: center, y2: 10 }, { x2: 90, y2: center });
    }

    if (type === "t") {
      base.push(
        { x2: center, y2: 10 },
        { x2: 10, y2: center },
        { x2: 90, y2: center },
      );
    }

    if (type === "cross") {
      base.push(
        { x2: center, y2: 10 },
        { x2: center, y2: 90 },
        { x2: 10, y2: center },
        { x2: 90, y2: center },
      );
    }

    return base;
  }, [type]);

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{
        transform: `rotate(${rotation * 90}deg)`,
        transition: "transform 250ms ease",
      }}
    >
      <circle cx="50" cy="50" r="8" fill={stroke} />

      {lines.map((line, index) => (
        <line
          key={index}
          x1="50"
          y1="50"
          x2={line.x2}
          y2={line.y2}
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

const HubInfinityFlow: React.FC = () => {
  const [levelId, setLevelId] = useState(1);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [completed, setCompleted] = useState(false);
  const [theme, setTheme] = useState<"sage" | "ocean">("sage");

  const level = levels.find((item) => item.id === levelId) ?? levels[0];

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (!saved) {
      setTiles(createLevel(levels[0]));
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (typeof parsed.levelId === "number") {
        const savedLevel =
          levels.find((item) => item.id === parsed.levelId) ?? levels[0];

        setLevelId(savedLevel.id);

        if (Array.isArray(parsed.tiles)) {
          setTiles(parsed.tiles);
        } else {
          setTiles(createLevel(savedLevel));
        }

        if (parsed.theme === "ocean" || parsed.theme === "sage") {
          setTheme(parsed.theme);
        }
      }
    } catch {
      setTiles(createLevel(levels[0]));
    }
  }, []);

  useEffect(() => {
    if (!tiles.length) return;

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        levelId,
        tiles,
        theme,
      }),
    );
  }, [levelId, tiles, theme]);

  useEffect(() => {
    if (!tiles.length) return;

    setCompleted(isSolved(level, tiles));
  }, [tiles, level]);

  const rotateTile = (index: number) => {
    if (completed) return;

    setTiles((current) =>
      current.map((tile, tileIndex) =>
        tileIndex === index
          ? {
              ...tile,
              rotation: (tile.rotation + 1) % 4,
            }
          : tile,
      ),
    );
  };

  const loadLevel = (id: number) => {
    const selected = levels.find((item) => item.id === id);

    if (!selected) return;

    setLevelId(selected.id);
    setTiles(createLevel(selected));
    setCompleted(false);
  };

  const nextLevel = () => {
    const next = levels.find((item) => item.id === levelId + 1);

    if (!next) {
      loadLevel(1);
      return;
    }

    loadLevel(next.id);
  };

  const resetLevel = () => {
    setTiles(createLevel(level));
    setCompleted(false);
  };

  const changeTheme = () => {
    setTheme((current) => (current === "sage" ? "ocean" : "sage"));
  };

  const background =
    theme === "sage"
      ? "linear-gradient(145deg, #edf7f0 0%, #f8fbf8 100%)"
      : "linear-gradient(145deg, #edf7f7 0%, #f8fbfb 100%)";

  return (
    <section
      style={{
        width: "100%",
        minHeight: "calc(100vh - 120px)",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          minHeight: "650px",
          margin: "0 auto",
          borderRadius: "28px",
          background,
          border: "1px solid rgba(61, 116, 91, 0.12)",
          boxShadow: "0 18px 45px rgba(35, 75, 60, 0.08)",
          padding: "32px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#6b9080",
                marginBottom: "6px",
              }}
            >
              Relax & Reset
            </div>

            <h1
              style={{
                margin: 0,
                color: "#244d40",
                fontSize: "28px",
              }}
            >
              Infinity Flow
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: "#648174",
              }}
            >
              Rotate the tiles until every path is correctly aligned.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {levels.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadLevel(item.id)}
                style={{
                  border: "1px solid #cfe0d5",
                  background: levelId === item.id ? "#347a68" : "#ffffff",
                  color: levelId === item.id ? "#ffffff" : "#376b5b",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {item.id}
              </button>
            ))}

            <button
              type="button"
              onClick={changeTheme}
              style={{
                border: "1px solid #cfe0d5",
                background: "#ffffff",
                color: "#376b5b",
                borderRadius: "10px",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Theme
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px 0",
          }}
        >
          <div
            style={{
              width: "min(72vw, 620px)",
              height: "min(72vw, 620px)",
              maxWidth: "620px",
              maxHeight: "620px",
              display: "grid",
              gridTemplateColumns: `repeat(${level.width}, 1fr)`,
              gridTemplateRows: `repeat(${level.height}, 1fr)`,
              gap: "8px",
              padding: "12px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(61,116,91,0.12)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            {tiles.map((tile, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Tile ${index + 1}, rotate`}
                onClick={() => rotateTile(index)}
                style={{
                  border: "0",
                  padding: 0,
                  borderRadius: "16px",
                  background: completed
                    ? "rgba(117, 180, 135, 0.22)"
                    : "rgba(234, 244, 237, 0.9)",
                  cursor: completed ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  transition: "background 180ms ease, transform 180ms ease",
                }}
              >
                <TileSVG type={tile.type} rotation={tile.rotation} />
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            paddingTop: "20px",
            borderTop: "1px solid rgba(61,116,91,0.1)",
          }}
        >
          <div>
            <strong
              style={{
                color: "#315f50",
              }}
            >
              Level {levelId}
            </strong>

            <span
              style={{
                marginLeft: "10px",
                color: "#769286",
              }}
            >
              {completed ? "Completed ✓" : "Keep going"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={resetLevel}
              style={{
                border: "1px solid #cfe0d5",
                background: "#ffffff",
                color: "#376b5b",
                borderRadius: "12px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Reset
            </button>

            {completed && (
              <button
                type="button"
                onClick={nextLevel}
                style={{
                  border: "0",
                  background: "#347a68",
                  color: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Next level →
              </button>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @media (max-width: 700px) {
            section {
              padding: 12px !important;
            }

            section > div {
              padding: 20px !important;
              border-radius: 20px !important;
            }
          }

          @media (max-width: 480px) {
            section > div {
              min-height: calc(100vh - 40px) !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              transition: none !important;
            }
          }
        `}
      </style>
    </section>
  );
};

export { HubInfinityFlow };

export const InfinityFlow = HubInfinityFlow;

export default HubInfinityFlow;
