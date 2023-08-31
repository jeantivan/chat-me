import { useEffect } from "react";

import {
  $getNodeByKey,
  $getRoot,
  $isLineBreakNode,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  TextNode,
  createCommand
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const TRIM_EDITOR_COMMAND = createCommand("TRIM_EDITOR_COMMAND");

const isTextNodeEmpty = (node: TextNode) => {
  return node.getTextContent().trim() === "";
};

const trimEditor = () => {
  // Primer y único párrafo
  const paragraph = $getRoot().getFirstChildOrThrow();

  const firstChild = paragraph.getFirstChild();
  const lastChild = paragraph.getLastChild();

  // Elimina los saltos de linea al inicio y TextNode vacíos al inicio del párrafo
  if (firstChild) {
    let nodeToRemove = $getNodeByKey(firstChild.getKey());
    let nextNodeToRemove = null;
    while (
      $isLineBreakNode(nodeToRemove) ||
      ($isTextNode(nodeToRemove) && isTextNodeEmpty(nodeToRemove))
    ) {
      nextNodeToRemove = nodeToRemove.getNextSibling();
      nodeToRemove.remove(false);
      nodeToRemove = nextNodeToRemove;
    }
  }
  // Elimina los saltos de linea al final y TextNode vacíos al inicio del párrafo
  if (lastChild) {
    let nodeToRemove = $getNodeByKey(lastChild.getKey());
    let nextNodeToRemove = null;
    while (
      $isLineBreakNode(nodeToRemove) ||
      ($isTextNode(nodeToRemove) && isTextNodeEmpty(nodeToRemove))
    ) {
      nextNodeToRemove = nodeToRemove.getPreviousSibling();
      nodeToRemove.remove(false);
      nodeToRemove = nextNodeToRemove;
    }
  }
};

export function TrimEditorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      TRIM_EDITOR_COMMAND,
      (payload?: { onUpdate: () => unknown }) => {
        editor.update(trimEditor, {
          onUpdate: () => {
            if (payload) {
              payload.onUpdate();
            }
          }
        });

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
