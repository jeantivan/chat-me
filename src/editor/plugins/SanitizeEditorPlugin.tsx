import { useEffect } from "react";

import {
  $getNodeByKey,
  $getRoot,
  $isParagraphNode,
  COMMAND_PRIORITY_LOW,
  createCommand
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const SANITIZE_EDITOR = createCommand("SANITIZE_EDITOR");

export function SanitizeEditorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeCommand = editor.registerCommand(
      SANITIZE_EDITOR,
      () => {
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
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return removeCommand;
  }, [editor]);

  return null;
}
