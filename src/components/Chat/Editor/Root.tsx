import { ReactNode } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LinkNode, AutoLinkNode } from "@lexical/link";

import { theme } from "./theme";

function onError(error: Error) {
  console.error(error);
}

const initialConfig = {
  namespace: "MessageInput",
  nodes: [AutoLinkNode, LinkNode],
  theme,
  onError,
};

export function Root({ children }: { children: ReactNode }) {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="input-container bg-background-2 text-background-12 h-full py-2.5 px-5 flex items-center">
        <div className="flex w-full gap-2 items-end">{children}</div>
      </div>
    </LexicalComposer>
  );
}
