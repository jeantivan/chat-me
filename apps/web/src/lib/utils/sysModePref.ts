const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export function sysModePref(): "dark" | "light" {
  if (typeof window !== "undefined") {
    return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light";
  }

  return "light";
}
