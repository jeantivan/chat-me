import { useState } from "react";
import { v4 as uuid } from "uuid";
import { SendIcon } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalIsTextContentEmpty } from "@lexical/react/useLexicalIsTextContentEmpty";
import { CustomIcon } from "@/components/CustomIcon";
import useStore from "@/lib/store";
import { SAVE_EDITOR } from "@/plugins/SaveEditorPlugin";
import { MessageType } from "@/lib/types";

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
  const [messageContent, setMessageContent] = useState("");
  const [editor] = useLexicalComposerContext();
  const isEditorEmpty = useLexicalIsTextContentEmpty(editor, true);

  const currentChatId = useStore((state) => state.currentChatId);
  const addMessage = useStore((state) => state.addMessage);

  const handleSubmit = () => {
    if (!currentChatId) return;

    editor.dispatchCommand(SAVE_EDITOR, {
      onSave: setMessageContent,
    });

    addMessage(createMessage(messageContent), currentChatId);
  };
  return (
    <button
      className="w-10 h-10 p-1.5 rounded-full text-emerald-600 disabled:text-neutral-500"
      onClick={handleSubmit}
      disabled={isEditorEmpty}
    >
      <CustomIcon
        icon={SendIcon}
        iconClassName="rotate-45"
        label="Enviar mensaje"
      />
    </button>
  );
}
