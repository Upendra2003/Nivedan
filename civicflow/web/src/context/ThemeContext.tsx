import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeCtx { dark: boolean; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ dark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true); // default: dark

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Apply dark class immediately on mount
  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
