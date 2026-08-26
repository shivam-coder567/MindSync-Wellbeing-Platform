import type { ThemeColors } from "./hexTypes";
export const infinityThemes: Record<string, ThemeColors> = {
  sage: {
    background: "linear-gradient(135deg,#071d1a,#123c34 55%,#1d4936)",
    glow: "#9be0ad",
    surface: "rgba(255,255,255,.045)",
    tile: "rgba(225,247,231,.035)",
    tileSelected: "rgba(165,225,181,.1)",
    border: "rgba(205,238,212,.22)",
    line: "#88b995",
    lineActive: "#d5f6dc",
    text: "#effaf1",
    muted: "#9dbbaa",
    accent: "#bde9c7",
  },
  ocean: {
    background: "linear-gradient(135deg,#061b27,#0b3444 55%,#124653)",
    glow: "#69d8e8",
    surface: "rgba(255,255,255,.045)",
    tile: "rgba(220,249,255,.035)",
    tileSelected: "rgba(111,220,236,.1)",
    border: "rgba(183,232,240,.22)",
    line: "#73b9c5",
    lineActive: "#d0faff",
    text: "#effcff",
    muted: "#9ec6cf",
    accent: "#a8eaf1",
  },
  twilight: {
    background: "linear-gradient(135deg,#141027,#28204c 55%,#44284f)",
    glow: "#d49af2",
    surface: "rgba(255,255,255,.045)",
    tile: "rgba(250,240,255,.035)",
    tileSelected: "rgba(222,184,249,.1)",
    border: "rgba(232,205,248,.22)",
    line: "#ba91d4",
    lineActive: "#f2dcff",
    text: "#fcf7ff",
    muted: "#c2afd0",
    accent: "#e2b9f5",
  },
};
export const getInfinityTheme = (id: string) =>
  infinityThemes[id] ?? infinityThemes.sage;
export const getInfinityThemes = () => Object.entries(infinityThemes);
export const getThemeForLevel = (id: number) =>
  getInfinityTheme(["sage", "ocean", "twilight"][(id - 1) % 3]);
