import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { COLOR_MODE_KEY } from "../utils/constants";
import { getInitialColorMode } from "../utils/getInitialColorMode";

interface DarkModeInterface {
  mode: string;
  toggleDarkMode: () => void;
  setDarkMode: Dispatch<SetStateAction<"dark" | "light">>;
}

export const DarkModeContext = createContext<DarkModeInterface>(
  {} as DarkModeInterface
);

export const useDarkMode = () => useContext(DarkModeContext);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setDarkMode] = useState<"dark" | "light">(() =>
    getInitialColorMode()
  );

  const toggleDarkMode = () => {
    let nextColorMode: "dark" | "light" = mode === "light" ? "dark" : "light";
    localStorage.setItem(COLOR_MODE_KEY, nextColorMode);
    setDarkMode(nextColorMode);
  };

  return (
    <DarkModeContext.Provider value={{ mode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}
