import { memo } from "react";
import type { RakeStroke } from "./zenTypes";

interface ZenRakePatternProps {
  strokes: RakeStroke[];
}

const ZenRakePattern = memo(function ZenRakePattern({ strokes }: ZenRakePatternProps) {
  return (
    <svg className="zen-rake-layer" aria-hidden="true">
      <defs>
        <filter id="zen-rake-shadow">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodColor="rgba(140,120,80,0.25)" />
        </filter>
      </defs>
      {strokes.map((stroke) => {
        if (stroke.points.length < 2) return null;
        const d = stroke.points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x}% ${p.y}%`)
          .join(" ");
        return (
          <g key={stroke.id}>
            {/* Shadow/depth */}
            <path
              d={d}
              stroke="rgba(160,140,100,0.18)"
              strokeWidth={stroke.width + 2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#zen-rake-shadow)"
              vectorEffect="non-scaling-stroke"
            />
            {/* Main line */}
            <path
              d={d}
              stroke="rgba(190,170,130,0.45)"
              strokeWidth={stroke.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* Highlight */}
            <path
              d={d}
              stroke="rgba(230,220,190,0.2)"
              strokeWidth={stroke.width * 0.4}
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
});

export default ZenRakePattern;
