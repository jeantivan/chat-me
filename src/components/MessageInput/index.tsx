import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { Laugh } from "lucide-react";

import { Root } from "./Root";
import { Plugins } from "./Plugins";
import { CustomIcon } from "@/components/CustomIcon";
import { SendMessage } from "./SendMessage";
import { AttachFiles } from "./AttachFiles";

const Placeholder = () => (
  <div className="absolute pl-1 pointer-events-none text-background-11">
    Escribe un mensaje aquí
  </div>
);

export function MessageInput() {
  return (
    <Root>
      <AttachFiles />
      <div className="flex-1 relative min-h-[44px] flex overflow-y-auto bg-background-5 rounded-md">
        <div className="flex items-end w-full max-h-[136px] py-2 max-w-full px-3">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="w-full bg-transparent focus:outline-none dark:text-white text-black" />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <button className="w-7 h-7 inline-flex rounded-full text-background-10">
            <CustomIcon
              icon={Laugh}
              label="Insertar emojis"
              className="w-full h-full"
            />
          </button>
        </div>
      </div>
      <SendMessage />
      <Plugins />
    </Root>
  );
}
