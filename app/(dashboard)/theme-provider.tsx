"use client";

import { useEffect } from "react";

export function ThemeProvider({
  mode,
  children,
}: {
  mode: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (mode === "auto") {
      // Detect system preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const applyTheme = (matches: boolean) => {
        if (matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };

      // Apply initial theme
      applyTheme(mediaQuery.matches);

      // Listen for system changes
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  return <>{children}</>;
}
