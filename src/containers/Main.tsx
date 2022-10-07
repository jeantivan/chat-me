import { ReactNode } from "react";
import cx from "classnames";
import { useDarkMode } from "../components";

export function Main({ children }: { children: ReactNode }) {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={cx({ dark: isDarkMode, light: !isDarkMode })}>
      <main className="app-container min-w-md w-full dark:bg-slate-900 overflow-hidden flex">
        {children}
      </main>
    </div>
  );
}
