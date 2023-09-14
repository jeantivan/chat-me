import { SendIcon } from "lucide-react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalIsTextContentEmpty } from "@lexical/react/useLexicalIsTextContentEmpty";
import { SAVE_EDITOR_COMMAND } from "@/editor/plugins/SaveEditorPlugin";

import { IconButton } from "@/components/ui/IconButton";

import mc from "@/lib/utils/mergeClassnames";
import { useFilesToSend } from "@/components/SendFiles";

export function SendMessage() {
  const [editor] = useLexicalComposerContext();
  const isEditorEmpty = useLexicalIsTextContentEmpty(editor, true);

  const { files } = useFilesToSend();

  const handleSubmit = () => {
    //if (isEditorEmpty) return;

    editor.dispatchCommand(SAVE_EDITOR_COMMAND, undefined);
  };

  return (
    <IconButton
      icon={SendIcon}
      label="Enviar mensaje"
      iconClassName="rotate-45"
      className={mc(
        "w-10 h-10 shrink-0",
        "bg-primary-9 hover:bg-primary-10 text-primary-12",
        "disabled:bg-primary-5 disabled:text-background-10",
        "[&_span]:-ml-1"
      )}
      onClick={handleSubmit}
      disabled={isEditorEmpty && files.length <= 0}
    />
  );
}
