import { ReactNode } from "react";
import cx from "classnames";
import { useTheme } from "@/lib/hooks";
import { DialogContainer } from "@/components/DialogContainer";

export function Main({ children }: { children: ReactNode }) {
  const { mode, colors } = useTheme();

  return (
    <div className={cx(mode, colors)}>
      <DialogContainer>
        <main className="app-container min-w-md w-full bg-background-1 overflow-hidden flex">
          {children}
        </main>
      </DialogContainer>
    </div>
  );
}
