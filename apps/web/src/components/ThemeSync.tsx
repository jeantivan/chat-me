import { useEffect } from "react";
import useStore from "@/lib/store";

const THEME_CLASSES = [
  "slate-indigo",
  "slate-sky",
  "sage-teal",
  "olive-grass",
  "gold-lime",
  "sand-yellow",
  "sand-orange",
  "mauve-crimson",
  "mauve-violet",
];

export function ThemeSync() {
  const mode = useStore((state) => state.theme.mode);
  const colors = useStore((state) => state.theme.colors);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove(...THEME_CLASSES);
    if (colors) {
      root.classList.add(colors);
    }
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode, colors]);

  return null;
}
