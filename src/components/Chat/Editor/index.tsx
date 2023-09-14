import { Root } from "./Root";
import { SendMessage } from "./SendMessage";

import { EmojiPicker } from "./EmojiPicker";
import { Input } from "./Input";
import { FilesToSendContext, useFilesToSend } from "@/components/SendFiles";
import { useUserId } from "@/lib/hooks";
import useStore from "@/lib/store";
import { createMessage } from "@/lib/utils/createMessage";
import { getImageData } from "@/lib/utils/getImageData";
import { useContext } from "react";

type EditorProps = {
  chatId: string;
  onSave?: (editorState: string) => void;
};
export function Editor(props: EditorProps) {
  const userId = useUserId();
  const addMessage = useStore((state) => state.addMessage);
  const { files } = useContext(FilesToSendContext);

  const onSave = async (body?: string) => {
    console.log({ files });
    if (files.length <= 0) {
      addMessage(
        createMessage({ chatId: props.chatId, owner: userId, body: body })
      );
    }
    debugger;

    const imageData = await getImageData(files[0]);

    console.log({ imageData });
  };

  return (
    <Root onSave={onSave}>
      <div className="h-full flex items-start gap-2.5 pl-2.5 bg-background-5 rounded-md w-full py-1.5">
        <EmojiPicker />
        <Input />
      </div>
      <SendMessage />
    </Root>
  );
}
