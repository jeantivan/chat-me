import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { SendIcon } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalIsTextContentEmpty } from "@lexical/react/useLexicalIsTextContentEmpty";

import { IconButton } from "@/components/ui/IconButton";
import { SAVE_EDITOR } from "@/plugins/SaveEditorPlugin";
import { TMessage } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
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

    editor.dispatchCommand(SAVE_EDITOR, {
      onSave: (body: string) =>
        addMessage(createMessage({ body, owner: userId, chatId })),
      asHtml: true
    });
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
