import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeCtx { dark: boolean; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ dark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false); // default: light (white)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Remove dark class on mount so default is light
  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
