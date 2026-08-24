import type { ThemeColors } from "./hexTypes";

export const THEMES: ThemeColors[] = [
  {
    // Sage Garden
    name: "Sage Garden",
    bg: "#f0ebe0",
    surface: "#e8e2d4",
    line: "#3a5a3a",
    lineActive: "#4a7a4a",
    glow: "#8ecba0",
    text: "#2a3a2a",
    textMuted: "#7a8a70",
    accent: "#6aaa7a",
  },
  {
    // Lavender Calm
    name: "Lavender Calm",
    bg: "#ece4f0",
    surface: "#e0d8e8",
    line: "#6a5080",
    lineActive: "#8060a0",
    glow: "#c0a0e0",
    text: "#3a2a4a",
    textMuted: "#8a7a9a",
    accent: "#a080c0",
  },
  {
    // Ocean Mist
    name: "Ocean Mist",
    bg: "#e4eef0",
    surface: "#d8e6ea",
    line: "#2a6070",
    lineActive: "#3a8090",
    glow: "#80c0d0",
    text: "#1a3a40",
    textMuted: "#6a9aa0",
    accent: "#50a0b0",
  },
  {
    // Sunset Peach
    name: "Sunset Peach",
    bg: "#f0e8e0",
    surface: "#eae0d4",
    line: "#8a5030",
    lineActive: "#a06040",
    glow: "#e0a080",
    text: "#4a2a1a",
    textMuted: "#a08070",
    accent: "#c08060",
  },
  {
    // Night Garden
    name: "Night Garden",
    bg: "#0e1a14",
    surface: "#14201a",
    line: "#6aaa8a",
    lineActive: "#80c0a0",
    glow: "#40c090",
    text: "#d0e8d8",
    textMuted: "#6a8a7a",
    accent: "#50b090",
  },
];

// Assign theme to level
export function getThemeForLevel(levelId: number): ThemeColors {
  const themeIndex = Math.floor(((levelId - 1) / 5)) % THEMES.length;
  return THEMES[themeIndex];
}
