import { useCallback, useEffect, useState } from "react";

export const THEME_KEY = "almanhal-theme";

/** Runs before paint (inlined in <head>) so dark mode never flashes. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // ignore
    }
    setDark(next);
  }, []);

  return { dark, toggle };
}
