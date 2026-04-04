/**
 * Nivedan Design Tokens — reactive theme store.
 * Uses a module-level pub/sub so any component calling useTheme()
 * re-renders automatically when the theme is toggled.
 * Default: light. Persisted via expo-secure-store.
 */
import { useState, useEffect } from "react";
import { saveSecure, loadSecure } from "../utils/storage";

// ── Token definitions ──────────────────────────────────────────────────────────

export const lightTheme = {
  background:            "#F5F6FF",
  surface:               "#FFFFFF",
  surfaceContainerLow:   "#F3F4F8",
  surfaceContainer:      "#ECEEF5",
  surfaceContainerHigh:  "#E4E6F0",

  primary:               "#6366F1",
  primaryDark:           "#4F52D4",
  primaryContainer:      "#EEF2FF",
  onPrimary:             "#FFFFFF",
  onPrimaryContainer:    "#6366F1",

  secondary:             "#E8891A",
  secondaryContainer:    "#FFF7ED",
  onSecondary:           "#FFFFFF",
  onSecondaryContainer:  "#92400E",

  tertiary:              "#22C55E",
  tertiaryContainer:     "#F0FDF4",
  onTertiary:            "#FFFFFF",

  text:                  "#111827",
  subtext:               "#6B7280",

  outline:               "#9CA3AF",
  outlineVariant:        "#E5E7EB",
  border:                "#E5E7EB",

  error:                 "#EF4444",
  errorContainer:        "#FEF2F2",
  onError:               "#FFFFFF",
};

export const darkTheme = {
  background:            "#0F0F1A",
  surface:               "#1A1B2E",
  surfaceContainerLow:   "#1F2138",
  surfaceContainer:      "#262843",
  surfaceContainerHigh:  "#2E3050",

  primary:               "#818CF8",
  primaryDark:           "#818CF8",
  primaryContainer:      "#312E81",
  onPrimary:             "#FFFFFF",
  onPrimaryContainer:    "#C7D2FE",

  secondary:             "#FBB96B",
  secondaryContainer:    "#78350F",
  onSecondary:           "#1C0A00",
  onSecondaryContainer:  "#FDE68A",

  tertiary:              "#4ADE80",
  tertiaryContainer:     "#14532D",
  onTertiary:            "#052E16",

  text:                  "#F1F1FF",
  subtext:               "#9CA3AF",

  outline:               "#6B7280",
  outlineVariant:        "#374151",
  border:                "#374151",

  error:                 "#F87171",
  errorContainer:        "#7F1D1D",
  onError:               "#FFFFFF",
};

export type Theme = typeof lightTheme;
export type ThemeMode = "light" | "dark";

// ── Module-level reactive store ────────────────────────────────────────────────
// All useTheme() callers subscribe; setThemeMode() notifies them all.

const STORAGE_KEY = "nivedan_theme_mode";
let _mode: ThemeMode = "light";
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((l) => l());
}

/** Switch theme globally — persists to secure storage. */
export function setThemeMode(mode: ThemeMode) {
  _mode = mode;
  _notify();
  saveSecure(STORAGE_KEY, mode).catch(() => {});
}


/** Load persisted preference at startup (call once in root layout). */
export async function loadPersistedTheme() {
  const saved = await loadSecure(STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    _mode = saved;
    _notify();
  }
}

// ── React hooks ───────────────────────────────────────────────────────────────

/** Returns the current Theme object. Re-renders when theme changes. */
export function useTheme(): Theme {
  const [mode, setMode] = useState<ThemeMode>(_mode);

  useEffect(() => {
    const listener = () => setMode(_mode);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return mode === "dark" ? darkTheme : lightTheme;
}

/** Returns current mode + toggle function. Use wherever the toggle button is. */
export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(_mode);

  useEffect(() => {
    const listener = () => setMode(_mode);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  const toggleTheme = () => setThemeMode(mode === "light" ? "dark" : "light");

  return { mode, toggleTheme };
}

// ── Status colours ─────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  pending:      "#9CA3AF",
  submitted:    "#6366F1",
  filed:        "#6366F1",
  acknowledged: "#F59E0B",
  under_review: "#F59E0B",
  next_step:    "#22C55E",
  resolved:     "#16A34A",
  failed:       "#EF4444",
};


export function trustStripColor(status: string): string {
  if (["resolved", "next_step"].includes(status)) return "#22C55E";
  if (status === "failed")                         return "#EF4444";
  if (status === "pending")                        return "#E5E7EB";
  return "#6366F1";
}
