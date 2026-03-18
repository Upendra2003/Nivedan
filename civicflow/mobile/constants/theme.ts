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

