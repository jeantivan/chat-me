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
import { useUserId } from "@/lib/hooks";
import useStore from "@/lib/store";
import { createMessage } from "@/lib/utils/createMessage";

const initialConfig: InitialConfigType = {
  ...baseConfig,
  namespace: "MessageInput"
};

type RootProps = { children: ReactNode; chatId: string };
export function Root({ children, chatId }: RootProps) {
  const userId = useUserId();
  const addMessage = useStore((state) => state.addMessage);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <>{children}</>
      <LinkPlugin />
      <AutoLinkPlugin />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ClearEditorPlugin />
      <TrimEditorPlugin />
      <SaveEditorPlugin
        onSave={(editorState) => {
          addMessage(
            createMessage({ owner: userId, chatId, body: editorState })
          );
        }}
      />
      <EmojiPlugin />
    </LexicalComposer>
  );
}
