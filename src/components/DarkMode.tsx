import { createContext, Dispatch, SetStateAction, useContext } from "react";
import { useTernaryDarkMode } from "usehooks-ts";

interface DarkModeInterface {
  isDarkMode: boolean;
  ternaryDarkMode: "dark" | "light" | "system";
  setDarkMode: Dispatch<SetStateAction<"dark" | "light" | "system">>;
}

export const DarkModeContext = createContext<DarkModeInterface>(
  {} as DarkModeInterface
);

export const useDarkMode = () => useContext(DarkModeContext);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode, ternaryDarkMode, setTernaryDarkMode } =
    useTernaryDarkMode();

  return (
    <DarkModeContext.Provider
      value={{ isDarkMode, ternaryDarkMode, setDarkMode: setTernaryDarkMode }}
    >
      {children}
    </DarkModeContext.Provider>
  );
}
