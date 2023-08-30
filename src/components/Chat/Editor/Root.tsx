import { ReactNode } from "react";
import {
  InitialConfigType,
  LexicalComposer
} from "@lexical/react/LexicalComposer";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import { baseConfig } from "@/editor/baseConfig";
import { AutoFocusPlugin } from "@/editor/plugins/AutoFocusPlugin";
import { AutoLinkPlugin } from "@/editor/plugins/AutoLinkPlugin";
import { EmojiPlugin } from "@/editor/plugins/EmojiPlugin";
import { SanitizeEditorPlugin } from "@/editor/plugins/SanitizeEditorPlugin";

const initialConfig: InitialConfigType = {
  ...baseConfig,
  namespace: "MessageInput"
};

export function Root({ children }: { children: ReactNode }) {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="input-container bg-background-2 text-background-12 h-full py-2.5 px-5 flex items-center">
        <div className="flex w-full gap-2 items-end">{children}</div>
      </div>
      <LinkPlugin />
      <AutoLinkPlugin />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ClearEditorPlugin />
      <SanitizeEditorPlugin />
      <EmojiPlugin />
    </LexicalComposer>
  );
}
