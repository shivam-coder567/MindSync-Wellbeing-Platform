/**
 * WellnessTrendChart.tsx
 *
 * SVG line chart showing mood, stress, and anxiety trends.
 *
 * Uses the student's REAL check-in data.
 * Never fabricates points or dates.
 */

import type { ChartPoint } from "../../services/wellnessAnalytics";

/* ── Colors ─────────────────────────────────────────────────── */

const COLORS = {
  mood: {
    line: "#4fa36b",
    dot: "#3a8a56",
    label: "Mood",
  },

  stress: {
    line: "#c27850",
    dot: "#a86240",
    label: "Stress",
  },

  anxiety: {
    line: "#7b6bb5",
    dot: "#6558a0",
    label: "Anxiety",
  },
} as const;

type MetricKey = "mood" | "stress" | "anxiety";

/* ── Chart dimensions ───────────────────────────────────────── */

const WIDTH = 720;
const HEIGHT = 260;

const PADDING = {
  top: 28,
  right: 24,
  bottom: 48,
  left: 44,
};

const CHART_W = WIDTH - PADDING.left - PADDING.right;

const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

/* ── Coordinate helpers ─────────────────────────────────────── */

function xFor(index: number, total: number): number {
  if (total <= 1) {
    return PADDING.left + CHART_W / 2;
  }

  return PADDING.left + (index / (total - 1)) * CHART_W;
}

/**
 * Values are from 1–5.
 *
 * 5 appears near the top.
 * 1 appears near the bottom.
 */
function yFor(value: number): number {
  const safeValue = Math.min(5, Math.max(1, value));

  return PADDING.top + ((5 - safeValue) / 4) * CHART_H;
}

/* ── Path generation ────────────────────────────────────────── */

function pathD(data: ChartPoint[], key: MetricKey): string {
  return data
    .map((point, index) => {
      const x = xFor(index, data.length);

      const y = yFor(point[key]);

      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/* ── Props ───────────────────────────────────────────────────── */

interface Props {
  data: ChartPoint[];
  visible?: boolean;
}

/* ── Component ──────────────────────────────────────────────── */

export default function WellnessTrendChart({ data, visible = true }: Props) {
  if (!visible || data.length === 0) {
    return null;
  }

  /*
   * We show:
   *
   * - first actual check-in
   * - middle actual check-in
   * - last actual check-in
   *
   * This keeps the chart clean while still representing
   * real dates.
   */
  const labelIndexes: number[] = [];

  if (data.length >= 1) {
    labelIndexes.push(0);
  }

  if (data.length >= 3) {
    const middleIndex = Math.floor((data.length - 1) / 2);

    if (!labelIndexes.includes(middleIndex)) {
      labelIndexes.push(middleIndex);
    }
  }

  if (data.length >= 2) {
    const lastIndex = data.length - 1;

    if (!labelIndexes.includes(lastIndex)) {
      labelIndexes.push(lastIndex);
    }
  }

  return (
    <div className="wellness-chart-wrap">
      <svg
        className="wellness-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Mood, stress, and anxiety trends from your recent check-ins"
      >
        <title>Wellbeing trend</title>

        {/* ── Horizontal grid ── */}

        {[1, 2, 3, 4, 5].map((value) => (
          <g key={value}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yFor(value)}
              y2={yFor(value)}
              stroke="rgba(75,142,102,0.08)"
              strokeWidth={1}
            />

            <text
              x={PADDING.left - 10}
              y={yFor(value) + 4}
              textAnchor="end"
              className="wellness-chart-label"
            >
              {value}
            </text>
          </g>
        ))}

        {/* ── Mood / Stress / Anxiety lines ── */}

        {(["mood", "stress", "anxiety"] as MetricKey[]).map((key) => (
          <path
            key={key}
            d={pathD(data, key)}
            fill="none"
            stroke={COLORS[key].line}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="wellness-chart-line"
          />
        ))}

        {/* ── Data points ── */}

        {data.map((point, index) =>
          (["mood", "stress", "anxiety"] as MetricKey[]).map((key) => {
            const x = xFor(index, data.length);

            const y = yFor(point[key]);

            return (
              <circle
                key={`${key}-${index}`}
                cx={x}
                cy={y}
                r={key === "mood" ? 4 : 3.5}
                fill={COLORS[key].dot}
                stroke="#ffffff"
                strokeWidth={1.5}
                className="wellness-chart-dot"
              >
                <title>
                  {`${point.label}: ${COLORS[key].label} ${point[key]}/5`}
                </title>
              </circle>
            );
          }),
        )}

        {/* ── X-axis date labels ── */}

        {labelIndexes.map((index) => {
          const point = data[index];

          return (
            <text
              key={`date-${index}`}
              x={xFor(index, data.length)}
              y={HEIGHT - 14}
              textAnchor="middle"
              className="wellness-chart-label"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      {/* ── Chart legend ── */}

      <div className="wellness-chart-key">
        <span>
          <i
            style={{
              background: COLORS.mood.line,
            }}
          />
          {COLORS.mood.label}
        </span>

        <span>
          <i
            style={{
              background: COLORS.stress.line,
            }}
          />
          {COLORS.stress.label}
        </span>

        <span>
          <i
            style={{
              background: COLORS.anxiety.line,
            }}
          />
          {COLORS.anxiety.label}
        </span>
      </div>
    </div>
  );
}
