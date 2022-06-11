import { createContext, useContext, useState } from "react";
import { COLOR_MODE_KEY } from "../utils/constants";
import { getInitialColorMode } from "../utils/getInitialColorMode";

export const DarkModeContext = createContext({
  mode: "",
  toggleDarkMode: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);

export function DarkModeProvider({ children }) {
  const [mode, setDarkMode] = useState(() => getInitialColorMode());

  const toggleDarkMode = () => {
    console.log("Hola");
    setDarkMode((prev) => {
      let nextColorMode = prev === "light" ? "dark" : "light";

      localStorage.setItem(COLOR_MODE_KEY, nextColorMode);
      return nextColorMode;
    });
  };

  return (
    <DarkModeContext.Provider value={{ mode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}
