import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { storage } from "@/src/utils/storage";
import { DARK, LIGHT, Theme } from "@/src/theme";

type Mode = "light" | "dark" | "system";

const ThemeCtx = createContext<{ t: Theme; mode: Mode; setMode: (m: Mode) => void }>({
  t: LIGHT,
  mode: "system",
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>("system");

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<string>("theme_mode", "system");
      if (saved === "light" || saved === "dark" || saved === "system") setModeState(saved);
    })();
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    storage.setItem("theme_mode", m);
  };

  const effective = mode === "system" ? (system ?? "light") : mode;
  const t = effective === "dark" ? DARK : LIGHT;

  return <ThemeCtx.Provider value={{ t, mode, setMode }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
