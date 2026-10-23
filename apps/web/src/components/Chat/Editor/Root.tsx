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
import { TrimEditorPlugin } from "@/editor/plugins/TrimEditorPlugin";
import { SaveEditorPlugin } from "@/editor/plugins/SaveEditorPlugin";
import { TypingPlugin } from "@/editor/plugins/TypingPlugin";

const initialConfig: InitialConfigType = {
  ...baseConfig,
  namespace: "MessageInput"
};

type RootProps = {
  children: ReactNode;
  onSave: (editorState: string) => void;
  chatId?: string;
};
export function Root({ children, onSave, chatId }: RootProps) {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <LinkPlugin />
      <AutoLinkPlugin />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ClearEditorPlugin />
      <TrimEditorPlugin />
      <EmojiPlugin />
      <SaveEditorPlugin onSave={onSave} />
      {chatId ? <TypingPlugin chatId={chatId} /> : <></>}
      <>{children}</>
    </LexicalComposer>
  );
}
