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
      <div className="input-container bg-slate-100 dark:bg-slate-700 h-full py-2 px-6 flex">
        <div className="flex items-center w-full gap-2">{children}</div>
      </div>
    </LexicalComposer>
  );
}
