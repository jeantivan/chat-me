import { COLOR_MODE_KEY } from "./constants";

export const getInitialColorMode = () => {
  // Si el usuario ya había elegido color para el tema se usa el mismo
  const hasColorMode = localStorage.getItem(COLOR_MODE_KEY) || "";
  if (hasColorMode === "light" || hasColorMode === "dark") {
    return hasColorMode;
  }

  // Si no han elegido algún modo, se chequea por color del sistema del usuario.
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const hasMediaQueryPreference = typeof mql.matches === "boolean";
  if (hasMediaQueryPreference) {
    localStorage.setItem(COLOR_MODE_KEY, mql.matches ? "dark" : "light");
    return mql.matches ? "dark" : "light";
  }

  localStorage.setItem(COLOR_MODE_KEY, "light");
  // Elige el modo claro por defecto
  return "light";
};
