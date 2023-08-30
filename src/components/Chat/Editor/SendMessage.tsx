import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { SendIcon } from "lucide-react";

import { CLEAR_EDITOR_COMMAND } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalIsTextContentEmpty } from "@lexical/react/useLexicalIsTextContentEmpty";

import { SANITIZE_EDITOR } from "@/editor/plugins/SanitizeEditorPlugin";

import { IconButton } from "@/components/ui/IconButton";

import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
import { TMessage } from "@/lib/types";
import { useUserId } from "@/lib/hooks";

const createMessage = ({
  chatId,
  owner,
  body = ""
}: {
  chatId: string;
  owner: string;
  body?: string;
}): TMessage => ({
  id: uuid(),
  chatId,
  owner,
  body,
  starred: false,
  forwarded: false,
  hasMedia: null,
  status: "read",
  reactions: [],
  time: dayjs().toISOString()
});

export function SendMessage({ chatId }: { chatId: string }) {
  const [editor] = useLexicalComposerContext();
  const isEditorEmpty = useLexicalIsTextContentEmpty(editor, true);
  const userId = useUserId();
  const addMessage = useStore((state) => state.addMessage);

  const handleSubmit = () => {
    if (isEditorEmpty) return;

    editor.dispatchCommand(SANITIZE_EDITOR, undefined);

    setTimeout(() => {
      const body = JSON.stringify(editor.getEditorState().toJSON());

      addMessage(createMessage({ body, owner: userId, chatId }));

      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
    }, 0);
  };
  return (
    <IconButton
      icon={SendIcon}
      label="Enviar mensaje"
      iconClassName="rotate-45"
      className={mc(
        "w-10 h-10",
        "bg-primary-9 hover:bg-primary-10 text-primary-12",
        "disabled:bg-primary-5 disabled:text-background-10",
        "[&_span]:-ml-1"
      )}
      onClick={handleSubmit}
      disabled={isEditorEmpty}
    />
  );
}
