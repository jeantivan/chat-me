import { COLOR_MODE_KEY } from "./constants";

export const getSystemColorMode = () => {
  let colorMode = "";
  // Chequea el esquema de color que está seleccionado en el sistema del usuario
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  if (typeof mediaQuery.matches === "boolean") {
    colorMode = mediaQuery.matches ? "dark" : "light";

    localStorage.setItem(COLOR_MODE_KEY, colorMode);
    return colorMode;
  }

  // Retorna modo claro si no hay color del sistema
  return "light";
};
