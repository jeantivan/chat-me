import { v4 as uuid } from "uuid";
import { SendIcon } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalIsTextContentEmpty } from "@lexical/react/useLexicalIsTextContentEmpty";
import { CustomIcon } from "@/components/CustomIcon";
import useStore from "@/lib/store";
import { SAVE_EDITOR } from "@/plugins/SaveEditorPlugin";
import { MessageType } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";

const createMessage = (content: string): MessageType => {
  return {
    id: uuid(),
    message: { type: "text", content },
    status: "read",
    isOwnMsg: true,
    isFavMsg: false,
    reactions: [],
    time: Date.now().toString(),
  };
};

export function SendMessage() {
  const [editor] = useLexicalComposerContext();
  const isEditorEmpty = useLexicalIsTextContentEmpty(editor, true);

  const currentChatId = useStore((state) => state.currentChatId);
  const addMessage = useStore((state) => state.addMessage);

  const handleSubmit = () => {
    if (!currentChatId) return;

    editor.dispatchCommand(SAVE_EDITOR, {
      onSave: (content: string) =>
        addMessage(createMessage(content), currentChatId),
    });

    //addMessage(createMessage(messageContent), currentChatId);
  };
  return (
    <button
      className={mc(
        "w-12 h-11 p-2 rounded-md inline-flex items-center justify-center",
        "bg-emerald-600 text-slate-50",
        "disabled:bg-emerald-600/50 disabled:text-slate-400"
      )}
      onClick={handleSubmit}
      disabled={isEditorEmpty}
    >
      <CustomIcon
        icon={SendIcon}
        label="Enviar mensaje"
        className="-ml-2"
        iconClassName="rotate-45"
      />
    </button>
  );
}
