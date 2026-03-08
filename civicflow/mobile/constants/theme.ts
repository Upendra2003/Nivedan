import { useColorScheme } from "react-native";

export const darkTheme = {
  background: "#0f172a",
  surface: "#1e293b",
  primary: "#1a56db",
  text: "#f1f5f9",
  subtext: "#94a3b8",
  border: "#334155",
};

export const lightTheme = {
  background: "#f8fafc",
  surface: "#ffffff",
  primary: "#1a56db",
  text: "#0f172a",
  subtext: "#64748b",
  border: "#e2e8f0",
};

export type Theme = typeof darkTheme;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}

// ── Kept for backward compat ──────────────────────────────────────────────────

export const colors = {
  primary: "#1a56db",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  subtext: "#64748b",
  border: "#e2e8f0",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 14, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
};
