"use client";

import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "massweddings_theme";
const DEFAULT_THEME: ThemeMode = "dark";
const LIGHT_THEME_COLOR = "#f8fafc";
const DARK_THEME_COLOR = "#0a0a0a";

let mediaCleanup: (() => void) | null = null;

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  initialized: boolean;
  initialize: () => void;
  setTheme: (theme: ThemeMode) => void;
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === "system" ? systemTheme() : theme;
}

function storedTheme(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : DEFAULT_THEME;
}

function applyTheme(resolvedTheme: ResolvedTheme): void {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;

  const themeColor = resolvedTheme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
  // The viewport export ships one theme-color meta per OS media query and the
  // browser honours whichever matches, so point both at the resolved colour.
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", themeColor);
  });
}

function watchSystemTheme(theme: ThemeMode, set: (state: Partial<ThemeState>) => void): void {
  mediaCleanup?.();
  mediaCleanup = null;

  if (typeof window === "undefined" || theme !== "system") return;

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    const resolvedTheme = resolveTheme("system");
    applyTheme(resolvedTheme);
    set({ resolvedTheme });
  };

  query.addEventListener("change", onChange);
  mediaCleanup = () => query.removeEventListener("change", onChange);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: DEFAULT_THEME,
  resolvedTheme: "dark",
  initialized: false,

  initialize: () => {
    const theme = storedTheme();
    const resolvedTheme = resolveTheme(theme);
    applyTheme(resolvedTheme);
    watchSystemTheme(theme, set);
    set({ theme, resolvedTheme, initialized: true });
  },

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }

    const resolvedTheme = resolveTheme(theme);
    applyTheme(resolvedTheme);
    watchSystemTheme(theme, set);
    set({ theme, resolvedTheme, initialized: true });
  },
}));
