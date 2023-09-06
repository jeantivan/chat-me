import { Root } from "./Root";
import { SendMessage } from "./SendMessage";

import { EmojiPicker } from "./EmojiPicker";
import { Input } from "./Input";

type EditorProps = {
  chatId: string;
};
export function Editor({ chatId }: EditorProps) {
  return (
    <Root chatId={chatId}>
      <div className="flex items-start gap-2.5 pl-2.5 bg-background-5 rounded-md w-full py-1.5">
        <EmojiPicker />
        <Input />
      </div>
      <SendMessage />
    </Root>
  );
}
