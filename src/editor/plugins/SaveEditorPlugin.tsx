import { useEffect } from "react";

import {
  $getRoot,
  createCommand,
  CLEAR_EDITOR_COMMAND,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { TRIM_EDITOR_COMMAND } from "./TrimEditorPlugin";

export const SAVE_EDITOR_COMMAND = createCommand("SAVE_EDITOR_COMMAND");

export function SaveEditorPlugin({
  onSave
}: {
  onSave: (editorState: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  const saveEditor = () => {
    const editorState = JSON.stringify(editor.getEditorState().toJSON());

    onSave(editorState);

    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SAVE_EDITOR_COMMAND,
        () => {
          const editorContentText = $getRoot().getTextContent();
          const trimmedTextContent = editorContentText.trim();

          const isEditorEmpty = trimmedTextContent.length <= 0;

          // Si el editor está vacío no se hace nada;
          if (isEditorEmpty) return true;

          // Si el editor tiene saltos de linea al inicio o final se eliminan
          // y luego se guarda el editor
          if (editorContentText !== trimmedTextContent) {
            editor.dispatchCommand(TRIM_EDITOR_COMMAND, {
              onUpdate: saveEditor
            });
          } else {
            saveEditor();
          }
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (!event?.shiftKey) {
            event?.preventDefault();

            const editorContentText = $getRoot().getTextContent();
            const trimmedTextContent = editorContentText.trim();

            const isEditorEmpty = trimmedTextContent.length <= 0;

            // Si el editor está vacío no se hace nada;
            if (isEditorEmpty) return true;

            // Si el editor tiene saltos de linea al inicio o final se eliminan
            // y luego se guarda el editor
            if (editorContentText !== trimmedTextContent) {
              editor.dispatchCommand(TRIM_EDITOR_COMMAND, {
                onUpdate: saveEditor
              });
            } else {
              saveEditor();
            }
          }
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  return null;
}
