import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import { AutoFocusPlugin } from "@/editor/plugins/AutoFocusPlugin";
import { AutoLinkPlugin } from "@/editor/plugins/AutoLinkPlugin";
import { SaveEditorPlugin } from "@/editor/plugins/SaveEditorPlugin";
import { EmojiPlugin } from "@/editor/plugins/EmojiPlugin";

export function Plugins() {
  return (
    <>
      <LinkPlugin />
      <AutoLinkPlugin />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ClearEditorPlugin />
      <SaveEditorPlugin />
      <EmojiPlugin />
    </>
  );
}
