import { v4 as uuid } from "uuid";
import { SendIcon } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalIsTextContentEmpty } from "@lexical/react/useLexicalIsTextContentEmpty";
import { CustomIcon } from "@/components/CustomIcon";
import useStore from "@/lib/store";
import { SAVE_EDITOR } from "@/plugins/SaveEditorPlugin";
import { TMessage } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";
import { useCurrentChatId, useUserId } from "@/lib/hooks";
import dayjs from "dayjs";

export function SendMessage() {
  const [editor] = useLexicalComposerContext();
  const isEditorEmpty = useLexicalIsTextContentEmpty(editor, true);
  const { currentChatId } = useCurrentChatId();
  const userId = useUserId();
  const addMessage = useStore((state) => state.addMessage);

  const createMessage = (body: string): TMessage => {
    return {
      id: uuid(),
      chatId: currentChatId,
      owner: userId,
      starred: false,
      forwarded: false,
      hasMedia: null,
      status: "read",
      reactions: [],
      time: dayjs().toISOString(),
      body,
    };
  };

  const handleSubmit = () => {
    if (!currentChatId) return;

    editor.dispatchCommand(SAVE_EDITOR, {
      onSave: (body: string) => addMessage(createMessage(body)),
      asHtml: true,
    });
  };
  return (
    <button
      className={mc(
        "w-11 h-11 p-2 rounded-md inline-flex items-center justify-center",
        "bg-emerald-600 text-slate-50",
        "disabled:bg-emerald-600/50 disabled:text-slate-400"
      )}
      onClick={handleSubmit}
      disabled={isEditorEmpty}
    >
      <CustomIcon
        icon={SendIcon}
        label="Enviar mensaje"
        className="-ml-1.5"
        iconClassName="rotate-45"
      />
    </button>
  );
}
