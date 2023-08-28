import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import { AutoFocusPlugin } from "@/plugins/AutoFocusPlugin";
import { AutoLinkPlugin } from "@/plugins/AutoLinkPlugin";
import { SaveEditorPlugin } from "@/plugins/SaveEditorPlugin";
import { EmojiPlugin } from "@/plugins/EmojiPlugin";

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
