import { ReactNode } from "react";
import cx from "classnames";
import { DialogContainer } from "@/components/DialogContainer";
import { MediaMessage } from "@/components/MediaMessage";
import { useTheme } from "@/lib/hooks";
import useStore from "@/lib/store";

export function Main({ children }: { children: ReactNode }) {
  const { mode, colors } = useTheme();
  const mediaMessage = useStore((state) => state.mediaMessage);

  return (
    <div className={cx(mode, colors)}>
      <DialogContainer>
        <main className="app-container min-w-md w-full bg-background-1 overflow-hidden flex">
          {children}
        </main>
        {mediaMessage && <MediaMessage mediaMessage={mediaMessage} />}
      </DialogContainer>
    </div>
  );
}
