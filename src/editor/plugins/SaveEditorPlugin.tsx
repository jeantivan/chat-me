import { useEffect } from "react";

import {
  $getNodeByKey,
  $getRoot,
  $isParagraphNode,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  createCommand,
} from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const SAVE_EDITOR = createCommand("SAVE_EDITOR");

type Payload = {
  asHtml?: boolean;
  onSave: (editorContent: string) => void;
};

export function SaveEditorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeCommand = editor.registerCommand(
      SAVE_EDITOR,
      (payload: Payload) => {
        editor.update(() => {
          const root = $getRoot();
          const firstChild = root.getFirstChild();
          const lastChild = root.getLastChild();

          // Remove empty paragraph at the beginning of the editor
          if (firstChild) {
            let nodeToRemove = $getNodeByKey(firstChild.getKey());
            let nextNodeToRemove = null;

            while ($isParagraphNode(nodeToRemove) && nodeToRemove.isEmpty()) {
              nextNodeToRemove = nodeToRemove.getNextSibling();
              nodeToRemove.remove(false);

              nodeToRemove = nextNodeToRemove;
            }
          }

          // Remove empty paragraph at the end of the editor
          if (lastChild) {
            let nodeToRemove = $getNodeByKey(lastChild.getKey());
            let nextNodeToRemove = null;

            while ($isParagraphNode(nodeToRemove) && nodeToRemove.isEmpty()) {
              nextNodeToRemove = nodeToRemove.getPreviousSibling();
              nodeToRemove.remove(false);

              nodeToRemove = nextNodeToRemove;
            }
          }

          payload.onSave($getRoot().getTextContent().trim());

          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
        });
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    return removeCommand;
  }, [editor]);

  return null;
}
