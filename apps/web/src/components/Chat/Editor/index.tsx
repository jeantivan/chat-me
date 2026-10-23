import { Root } from "./Root";
import { SendMessage } from "./SendMessage";

import { EmojiPicker } from "./EmojiPicker";
import { Input } from "./Input";
import { FilesToSendContext } from "@/components/SendFiles";
import { useSendMessage } from "@/lib/api/chatQueries";
import { useContext } from "react";

type EditorProps = {
  chatId: string;
  onSave?: (editorState: string) => void;
};

export function Editor(props: EditorProps) {
  const sendMessage = useSendMessage(props.chatId);
  const { files } = useContext(FilesToSendContext);

  const onSave = async (body?: string) => {
    if (!body) return;
    if (props.onSave) {
      props.onSave(body);
      return;
    }
    if (files.length <= 0) {
      sendMessage(body);
    }
  };

  return (
    <Root chatId={props.chatId} onSave={onSave}>
      <div className="h-full flex items-start gap-2.5 pl-2.5 bg-background-5 rounded-md w-full py-1.5">
        <EmojiPicker />
        <Input />
      </div>
      <SendMessage />
    </Root>
  );
}
