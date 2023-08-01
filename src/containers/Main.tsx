import { ReactNode } from "react";
import cx from "classnames";
import { useTheme } from "@/lib/hooks";

export function Main({ children }: { children: ReactNode }) {
  const { mode, colors } = useTheme();

  return (
    <div className={cx(mode, colors)}>
      <main className="app-container min-w-md w-full bg-background-1 overflow-hidden flex">
        {children}
      </main>
    </div>
  );
}
