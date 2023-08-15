import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { Laugh } from "lucide-react";

import { Root } from "./Root";
import { Plugins } from "./Plugins";
import { SendMessage } from "./SendMessage";
import { AddImage } from "./AddImage";

import { IconButton } from "@/components/ui/IconButton";
import { ScrollArea } from "@/components/ui/ScrollArea";

type EditorProps = {
  chatId: string;
};
export function Editor({ chatId }: EditorProps) {
  return (
    <Root>
      <AddImage />
      <ScrollArea
        type="auto"
        className="max-h-[136px]"
        rootClassName="flex-1 w-full relative bg-background-5 rounded-md py-1.5"
      >
        <div className="flex gap-1 items-end px-3">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="w-full h-full bg-transparent focus:outline-none dark:text-white text-black" />
            }
            placeholder={
              <div className="absolute top-2 pl-1 pointer-events-none text-background-11">
                Escribe un mensaje aquí
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <IconButton
            icon={Laugh}
            label="Insertar emojis"
            className="w-7 h-7 p-0 text-background-10"
          />
        </div>
      </ScrollArea>

      <SendMessage chatId={chatId} />
      <Plugins />
    </Root>
  );
}
