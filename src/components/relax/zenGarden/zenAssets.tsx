import type { GardenObjectDef } from "./zenTypes";
import React from "react";

/**
 * All garden objects defined as inline SVG render functions.
 * Each returns lightweight, crisp vector artwork.
 */

const stones: GardenObjectDef[] = [
  {
    id: "stone-grey",
    name: "Grey Stone",
    category: "stones",
    render: (s) => (
      <svg viewBox="0 0 60 40" width={s} height={s * 0.67}>
        <defs>
          <radialGradient id="sg" cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#9a9e96" />
            <stop offset="60%" stopColor="#7a7e76" />
            <stop offset="100%" stopColor="#5a5e56" />
          </radialGradient>
        </defs>
        <ellipse cx="30" cy="22" rx="28" ry="16" fill="url(#sg)" />
        <ellipse cx="24" cy="17" rx="10" ry="5" fill="rgba(255,255,255,0.12)" />
      </svg>
    ),
  },
  {
    id: "stone-dark",
    name: "Dark River Stone",
    category: "stones",
    render: (s) => (
      <svg viewBox="0 0 50 36" width={s} height={s * 0.72}>
        <defs>
          <radialGradient id="sd" cx="38%" cy="32%" r="55%">
            <stop offset="0%" stopColor="#5a5550" />
            <stop offset="60%" stopColor="#3a3530" />
            <stop offset="100%" stopColor="#252220" />
          </radialGradient>
        </defs>
        <ellipse cx="25" cy="19" rx="23" ry="15" fill="url(#sd)" />
        <ellipse cx="19" cy="14" rx="8" ry="4" fill="rgba(255,255,255,0.08)" />
      </svg>
    ),
  },
  {
    id: "stone-white",
    name: "White Stone",
    category: "stones",
    render: (s) => (
      <svg viewBox="0 0 44 32" width={s} height={s * 0.73}>
        <defs>
          <radialGradient id="sw" cx="42%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#f0ede8" />
            <stop offset="60%" stopColor="#d8d5d0" />
            <stop offset="100%" stopColor="#c0bdb8" />
          </radialGradient>
        </defs>
        <ellipse cx="22" cy="17" rx="20" ry="13" fill="url(#sw)" />
        <ellipse cx="17" cy="13" rx="7" ry="4" fill="rgba(255,255,255,0.25)" />
      </svg>
    ),
  },
  {
    id: "stone-brown",
    name: "Warm Stone",
    category: "stones",
    render: (s) => (
      <svg viewBox="0 0 48 34" width={s} height={s * 0.71}>
        <defs>
          <radialGradient id="sb" cx="40%" cy="33%" r="55%">
            <stop offset="0%" stopColor="#a08060" />
            <stop offset="60%" stopColor="#806040" />
            <stop offset="100%" stopColor="#604830" />
          </radialGradient>
        </defs>
        <ellipse cx="24" cy="18" rx="22" ry="14" fill="url(#sb)" />
        <ellipse cx="18" cy="14" rx="8" ry="4" fill="rgba(255,255,255,0.10)" />
      </svg>
    ),
  },
  {
    id: "stone-blue",
    name: "Blue Stone",
    category: "stones",
    render: (s) => (
      <svg viewBox="0 0 42 30" width={s} height={s * 0.71}>
        <defs>
          <radialGradient id="sbl" cx="40%" cy="33%" r="55%">
            <stop offset="0%" stopColor="#7a9aaa" />
            <stop offset="60%" stopColor="#5a7a8a" />
            <stop offset="100%" stopColor="#4a6a7a" />
          </radialGradient>
        </defs>
        <ellipse cx="21" cy="16" rx="19" ry="12" fill="url(#sbl)" />
        <ellipse cx="16" cy="12" rx="7" ry="3.5" fill="rgba(255,255,255,0.12)" />
      </svg>
    ),
  },
];

const pebbles: GardenObjectDef[] = [
  {
    id: "pebble-grey",
    name: "Grey Pebble",
    category: "pebbles",
    render: (s) => (
      <svg viewBox="0 0 28 24" width={s} height={s * 0.86}>
        <defs>
          <radialGradient id="pg" cx="40%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#a0a49c" />
            <stop offset="100%" stopColor="#6a6e66" />
          </radialGradient>
        </defs>
        <ellipse cx="14" cy="13" rx="12" ry="9" fill="url(#pg)" />
      </svg>
    ),
  },
  {
    id: "pebble-dark",
    name: "Dark Pebble",
    category: "pebbles",
    render: (s) => (
      <svg viewBox="0 0 26 22" width={s} height={s * 0.85}>
        <defs>
          <radialGradient id="pd" cx="40%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#555" />
            <stop offset="100%" stopColor="#2a2a2a" />
          </radialGradient>
        </defs>
        <ellipse cx="13" cy="12" rx="11" ry="8" fill="url(#pd)" />
      </svg>
    ),
  },
  {
    id: "pebble-white",
    name: "White Pebble",
    category: "pebbles",
    render: (s) => (
      <svg viewBox="0 0 24 20" width={s} height={s * 0.83}>
        <defs>
          <radialGradient id="pw" cx="40%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#f5f2ed" />
            <stop offset="100%" stopColor="#d5d2cd" />
          </radialGradient>
        </defs>
        <ellipse cx="12" cy="11" rx="10" ry="8" fill="url(#pw)" />
      </svg>
    ),
  },
  {
    id: "pebble-amber",
    name: "Amber Pebble",
    category: "pebbles",
    render: (s) => (
      <svg viewBox="0 0 24 20" width={s} height={s * 0.83}>
        <defs>
          <radialGradient id="pa" cx="40%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#d4a860" />
            <stop offset="100%" stopColor="#b08840" />
          </radialGradient>
        </defs>
        <ellipse cx="12" cy="11" rx="10" ry="8" fill="url(#pa)" />
      </svg>
    ),
  },
  {
    id: "pebble-teal",
    name: "Teal Pebble",
    category: "pebbles",
    render: (s) => (
      <svg viewBox="0 0 24 20" width={s} height={s * 0.83}>
        <defs>
          <radialGradient id="pt" cx="40%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#6aaa9a" />
            <stop offset="100%" stopColor="#4a8a7a" />
          </radialGradient>
        </defs>
        <ellipse cx="12" cy="11" rx="10" ry="8" fill="url(#pt)" />
      </svg>
    ),
  },
];

const shells: GardenObjectDef[] = [
  {
    id: "shell-scallop",
    name: "Scallop Shell",
    category: "shells",
    render: (s) => (
      <svg viewBox="0 0 40 36" width={s} height={s * 0.9}>
        <defs>
          <radialGradient id="shsc" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#f0e8d8" />
            <stop offset="100%" stopColor="#d8c8a8" />
          </radialGradient>
        </defs>
        <path d="M20 4 Q5 14 2 28 Q12 34 20 32 Q28 34 38 28 Q35 14 20 4Z" fill="url(#shsc)" />
        <path d="M20 8 L8 26" stroke="rgba(180,160,120,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M20 8 L14 27" stroke="rgba(180,160,120,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M20 8 L20 30" stroke="rgba(180,160,120,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M20 8 L26 27" stroke="rgba(180,160,120,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M20 8 L32 26" stroke="rgba(180,160,120,0.3)" strokeWidth="0.8" fill="none" />
        <ellipse cx="20" cy="12" rx="6" ry="3" fill="rgba(255,255,255,0.15)" />
      </svg>
    ),
  },
  {
    id: "shell-spiral",
    name: "Spiral Shell",
    category: "shells",
    render: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <defs>
          <radialGradient id="shsp" cx="45%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#f5ede0" />
            <stop offset="100%" stopColor="#c8b898" />
          </radialGradient>
        </defs>
        <circle cx="18" cy="18" r="14" fill="url(#shsp)" />
        <path d="M18 18 Q18 8 24 8 Q30 8 30 14 Q30 22 22 22 Q14 22 14 16 Q14 12 18 12" stroke="rgba(160,140,100,0.35)" strokeWidth="1.2" fill="none" />
        <circle cx="18" cy="18" r="2" fill="rgba(160,140,100,0.3)" />
      </svg>
    ),
  },
  {
    id: "shell-small",
    name: "Small Shell",
    category: "shells",
    render: (s) => (
      <svg viewBox="0 0 28 24" width={s} height={s * 0.86}>
        <defs>
          <radialGradient id="shsm" cx="45%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#f0e8dd" />
            <stop offset="100%" stopColor="#c0b090" />
          </radialGradient>
        </defs>
        <ellipse cx="14" cy="13" rx="12" ry="9" fill="url(#shsm)" />
        <path d="M14 5 L8 19" stroke="rgba(160,140,100,0.25)" strokeWidth="0.7" fill="none" />
        <path d="M14 5 L14 21" stroke="rgba(160,140,100,0.25)" strokeWidth="0.7" fill="none" />
        <path d="M14 5 L20 19" stroke="rgba(160,140,100,0.25)" strokeWidth="0.7" fill="none" />
      </svg>
    ),
  },
];

const flowers: GardenObjectDef[] = [
  {
    id: "flower-daisy",
    name: "Daisy",
    category: "flowers",
    render: (s) => (
      <svg viewBox="0 0 40 40" width={s} height={s}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse key={a} cx="20" cy="8" rx="4" ry="8" fill="#f8f4ee"
            transform={`rotate(${a} 20 20)`} opacity="0.92" />
        ))}
        <circle cx="20" cy="20" r="5" fill="#e8c840" />
        <circle cx="20" cy="20" r="3" fill="#d4a830" />
      </svg>
    ),
  },
  {
    id: "flower-pink",
    name: "Pink Flower",
    category: "flowers",
    render: (s) => (
      <svg viewBox="0 0 40 40" width={s} height={s}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="20" cy="9" rx="5.5" ry="9" fill="#e8a0b0"
            transform={`rotate(${a} 20 20)`} opacity="0.88" />
        ))}
        <circle cx="20" cy="20" r="4.5" fill="#f0d0d8" />
        <circle cx="20" cy="20" r="2.5" fill="#e8a0b0" />
      </svg>
    ),
  },
  {
    id: "flower-cherry",
    name: "Cherry Blossom",
    category: "flowers",
    render: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="18" cy="8" rx="4.5" ry="8" fill="#f4c0c8"
            transform={`rotate(${a} 18 18)`} opacity="0.85" />
        ))}
        <circle cx="18" cy="18" r="3.5" fill="#f8e0e4" />
        <circle cx="18" cy="18" r="1.8" fill="#e8a0a8" />
      </svg>
    ),
  },
  {
    id: "flower-lotus",
    name: "Lotus",
    category: "flowers",
    render: (s) => (
      <svg viewBox="0 0 44 36" width={s} height={s * 0.82}>
        <ellipse cx="22" cy="28" rx="18" ry="6" fill="rgba(180,210,160,0.3)" />
        {[0, 30, 60, 90, 120, 150].map((a) => (
          <ellipse key={a} cx="22" cy="14" rx="5" ry="10" fill="#f0d0d8"
            transform={`rotate(${a - 75} 22 22)`} opacity="0.8" />
        ))}
        <circle cx="22" cy="20" r="4" fill="#f8e8ec" />
      </svg>
    ),
  },
  {
    id: "flower-yellow",
    name: "Yellow Flower",
    category: "flowers",
    render: (s) => (
      <svg viewBox="0 0 38 38" width={s} height={s}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse key={a} cx="19" cy="8" rx="4.5" ry="8.5" fill="#f0d040"
            transform={`rotate(${a} 19 19)`} opacity="0.88" />
        ))}
        <circle cx="19" cy="19" r="4" fill="#d89020" />
      </svg>
    ),
  },
  {
    id: "flower-purple",
    name: "Purple Flower",
    category: "flowers",
    render: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="18" cy="8" rx="4" ry="8" fill="#a880c0"
            transform={`rotate(${a} 18 18)`} opacity="0.85" />
        ))}
        <circle cx="18" cy="18" r="3.5" fill="#d0c0e0" />
      </svg>
    ),
  },
  {
    id: "flower-white",
    name: "White Blossom",
    category: "flowers",
    render: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="18" cy="8" rx="4.5" ry="8.5" fill="#f8f4f0"
            transform={`rotate(${a} 18 18)`} opacity="0.9" />
        ))}
        <circle cx="18" cy="18" r="3" fill="#f0e8a0" />
      </svg>
    ),
  },
];

const plants: GardenObjectDef[] = [
  {
    id: "plant-grass",
    name: "Grass",
    category: "plants",
    render: (s) => (
      <svg viewBox="0 0 32 40" width={s * 0.8} height={s}>
        <path d="M16 38 Q12 28 10 18 Q8 10 12 4" stroke="#6a9a5a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M16 38 Q18 26 20 16 Q22 8 18 2" stroke="#7aaa6a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M16 38 Q14 30 16 22 Q18 14 22 8" stroke="#5a8a4a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M16 38 Q20 30 22 20 Q24 14 20 10" stroke="#8aba7a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "plant-bush",
    name: "Small Bush",
    category: "plants",
    render: (s) => (
      <svg viewBox="0 0 48 40" width={s} height={s * 0.83}>
        <ellipse cx="24" cy="28" rx="20" ry="10" fill="rgba(80,130,60,0.3)" />
        <circle cx="16" cy="22" r="10" fill="#5a9a4a" />
        <circle cx="28" cy="20" r="11" fill="#4a8a3a" />
        <circle cx="22" cy="16" r="9" fill="#6aaa5a" />
        <circle cx="20" cy="14" r="3" fill="rgba(255,255,255,0.08)" />
      </svg>
    ),
  },
  {
    id: "plant-bamboo",
    name: "Bamboo",
    category: "plants",
    render: (s) => (
      <svg viewBox="0 0 30 50" width={s * 0.6} height={s}>
        <rect x="13" y="5" width="4" height="42" rx="2" fill="#6a9a4a" />
        <rect x="13" y="14" width="4" height="1" fill="#5a8a3a" />
        <rect x="13" y="24" width="4" height="1" fill="#5a8a3a" />
        <rect x="13" y="34" width="4" height="1" fill="#5a8a3a" />
        <path d="M17 14 Q22 12 24 8" stroke="#6a9a4a" strokeWidth="1.5" fill="none" />
        <ellipse cx="24" cy="7" rx="4" ry="2.5" fill="#7aaa5a" transform="rotate(-20 24 7)" />
        <path d="M13 24 Q8 22 6 18" stroke="#6a9a4a" strokeWidth="1.5" fill="none" />
        <ellipse cx="5" cy="17" rx="4" ry="2.5" fill="#7aaa5a" transform="rotate(20 5 17)" />
      </svg>
    ),
  },
  {
    id: "plant-leafy",
    name: "Leafy Plant",
    category: "plants",
    render: (s) => (
      <svg viewBox="0 0 44 44" width={s} height={s}>
        <ellipse cx="22" cy="36" rx="12" ry="5" fill="rgba(80,130,60,0.25)" />
        {[-40, -15, 10, 35, 60].map((a, i) => (
          <path key={i}
            d={`M22 34 Q${22 + (i - 2) * 4} ${20 - i * 2} ${22 + (i - 2) * 8} ${10 + Math.abs(i - 2) * 3}`}
            stroke="#5a9a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
        ))}
        {[-35, -10, 15, 40, 65].map((a, i) => (
          <ellipse key={`l${i}`}
            cx={22 + (i - 2) * 7} cy={12 + Math.abs(i - 2) * 2}
            rx="5" ry="3" fill="#6aaa5a"
            transform={`rotate(${a} ${22 + (i - 2) * 7} ${12 + Math.abs(i - 2) * 2})`}
            opacity="0.85" />
        ))}
      </svg>
    ),
  },
];

const moss: GardenObjectDef[] = [
  {
    id: "moss-clump",
    name: "Moss",
    category: "moss",
    render: (s) => (
      <svg viewBox="0 0 40 28" width={s} height={s * 0.7}>
        <ellipse cx="20" cy="18" rx="18" ry="8" fill="rgba(80,120,50,0.3)" />
        {[8, 14, 20, 26, 32].map((x, i) => (
          <circle key={i} cx={x} cy={14 + (i % 2) * 3} r={4 + (i % 3)} fill="#5a9040" opacity={0.7 + (i % 2) * 0.15} />
        ))}
        <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.06)" />
      </svg>
    ),
  },
  {
    id: "moss-round",
    name: "Round Moss",
    category: "moss",
    render: (s) => (
      <svg viewBox="0 0 32 32" width={s} height={s}>
        <defs>
          <radialGradient id="mr" cx="40%" cy="38%" r="50%">
            <stop offset="0%" stopColor="#7ab050" />
            <stop offset="100%" stopColor="#4a8030" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#mr)" />
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.08)" />
      </svg>
    ),
  },
];

const nature: GardenObjectDef[] = [
  {
    id: "butterfly",
    name: "Butterfly",
    category: "nature",
    render: (s) => (
      <svg viewBox="0 0 40 32" width={s} height={s * 0.8}>
        <rect x="19" y="10" width="2" height="14" rx="1" fill="#555" />
        <ellipse cx="13" cy="14" rx="8" ry="6" fill="#e88090" opacity="0.85"
          transform="rotate(-10 13 14)" />
        <ellipse cx="27" cy="14" rx="8" ry="6" fill="#e88090" opacity="0.85"
          transform="rotate(10 27 14)" />
        <ellipse cx="14" cy="20" rx="5" ry="4" fill="#d07080" opacity="0.75"
          transform="rotate(-5 14 20)" />
        <ellipse cx="26" cy="20" rx="5" ry="4" fill="#d07080" opacity="0.75"
          transform="rotate(5 26 20)" />
        <circle cx="11" cy="12" r="2" fill="rgba(255,255,255,0.15)" />
        <circle cx="29" cy="12" r="2" fill="rgba(255,255,255,0.15)" />
        <line x1="18" y1="10" x2="15" y2="5" stroke="#555" strokeWidth="0.8" />
        <line x1="22" y1="10" x2="25" y2="5" stroke="#555" strokeWidth="0.8" />
        <circle cx="15" cy="4.5" r="1" fill="#555" />
        <circle cx="25" cy="4.5" r="1" fill="#555" />
      </svg>
    ),
  },
  {
    id: "petal-pink",
    name: "Pink Petal",
    category: "nature",
    render: (s) => (
      <svg viewBox="0 0 20 16" width={s} height={s * 0.8}>
        <ellipse cx="10" cy="8" rx="8" ry="5" fill="#f0b0b8" opacity="0.75"
          transform="rotate(-15 10 8)" />
      </svg>
    ),
  },
  {
    id: "petal-white",
    name: "White Petal",
    category: "nature",
    render: (s) => (
      <svg viewBox="0 0 18 14" width={s} height={s * 0.78}>
        <ellipse cx="9" cy="7" rx="7" ry="4.5" fill="#f5f0ea" opacity="0.7"
          transform="rotate(10 9 7)" />
      </svg>
    ),
  },
  {
    id: "leaf-fallen",
    name: "Fallen Leaf",
    category: "nature",
    render: (s) => (
      <svg viewBox="0 0 28 20" width={s} height={s * 0.71}>
        <path d="M4 14 Q14 2 24 8 Q18 14 4 14Z" fill="#c09040" opacity="0.8" />
        <path d="M4 14 Q14 8 24 8" stroke="rgba(160,120,40,0.4)" strokeWidth="0.7" fill="none" />
      </svg>
    ),
  },
  {
    id: "mushroom",
    name: "Tiny Mushroom",
    category: "nature",
    render: (s) => (
      <svg viewBox="0 0 24 28" width={s * 0.8} height={s}>
        <rect x="10" y="16" width="4" height="10" rx="2" fill="#d8c8a8" />
        <ellipse cx="12" cy="14" rx="10" ry="8" fill="#c06040" />
        <circle cx="8" cy="11" r="1.5" fill="rgba(255,255,255,0.2)" />
        <circle cx="14" cy="9" r="1" fill="rgba(255,255,255,0.15)" />
      </svg>
    ),
  },
];

const decor: GardenObjectDef[] = [
  {
    id: "buddha",
    name: "Buddha",
    category: "decor",
    render: (s) => (
      <svg viewBox="0 0 36 48" width={s * 0.75} height={s}>
        <ellipse cx="18" cy="44" rx="14" ry="4" fill="rgba(120,100,80,0.2)" />
        <path d="M10 42 Q10 30 12 24 Q14 18 18 16 Q22 18 24 24 Q26 30 26 42Z" fill="#8a7a60" />
        <circle cx="18" cy="14" r="8" fill="#9a8a70" />
        <circle cx="18" cy="6" r="4" fill="#a09080" />
        <path d="M14 12 Q18 10 22 12" stroke="rgba(60,50,40,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M13 15 Q18 13 23 15" stroke="rgba(60,50,40,0.2)" strokeWidth="0.6" fill="none" />
      </svg>
    ),
  },
  {
    id: "lantern",
    name: "Lantern",
    category: "decor",
    render: (s) => (
      <svg viewBox="0 0 28 44" width={s * 0.64} height={s}>
        <rect x="12" y="2" width="4" height="6" rx="1" fill="#8a7a60" />
        <path d="M6 10 Q6 8 14 8 Q22 8 22 10 L20 28 Q20 30 14 30 Q8 30 8 28Z" fill="#a09070" />
        <rect x="10" y="30" width="8" height="4" rx="1" fill="#8a7a60" />
        <rect x="11" y="34" width="6" height="6" rx="1" fill="#7a6a50" />
        <rect x="9" y="40" width="10" height="3" rx="1" fill="#6a5a40" />
        <rect x="10" y="14" width="8" height="10" rx="1" fill="rgba(200,180,100,0.2)" />
      </svg>
    ),
  },
  {
    id: "bridge",
    name: "Tiny Bridge",
    category: "decor",
    render: (s) => (
      <svg viewBox="0 0 60 28" width={s} height={s * 0.47}>
        <path d="M4 24 Q30 4 56 24" stroke="#8a7a60" strokeWidth="3" fill="none" strokeLinecap="round" />
        <line x1="18" y1="14" x2="18" y2="24" stroke="#8a7a60" strokeWidth="2" />
        <line x1="42" y1="14" x2="42" y2="24" stroke="#8a7a60" strokeWidth="2" />
        <path d="M8 24 Q30 8 52 24" stroke="rgba(180,160,120,0.3)" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    id: "pond",
    name: "Pond",
    category: "decor",
    render: (s) => (
      <svg viewBox="0 0 60 40" width={s} height={s * 0.67}>
        <defs>
          <radialGradient id="pond-g" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="rgba(100,170,160,0.5)" />
            <stop offset="70%" stopColor="rgba(70,130,120,0.4)" />
            <stop offset="100%" stopColor="rgba(50,100,90,0.3)" />
          </radialGradient>
        </defs>
        <ellipse cx="30" cy="20" rx="28" ry="16" fill="url(#pond-g)" />
        <ellipse cx="24" cy="16" rx="8" ry="3" fill="rgba(255,255,255,0.08)" />
        <path d="M14 20 Q22 18 30 20 Q38 22 46 20" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" fill="none" />
      </svg>
    ),
  },
];

export const ALL_OBJECTS: GardenObjectDef[] = [
  ...stones,
  ...pebbles,
  ...shells,
  ...flowers,
  ...plants,
  ...moss,
  ...nature,
  ...decor,
];

export const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "⊞" },
  { id: "stones", label: "Stones", icon: "●" },
  { id: "pebbles", label: "Pebbles", icon: "◦" },
  { id: "shells", label: "Shells", icon: "◡" },
  { id: "flowers", label: "Flowers", icon: "✿" },
  { id: "plants", label: "Plants", icon: "♠" },
  { id: "moss", label: "Moss", icon: "▓" },
  { id: "nature", label: "Nature", icon: "❀" },
  { id: "decor", label: "Decor", icon: "☽" },
];
