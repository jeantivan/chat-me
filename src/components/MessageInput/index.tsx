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
  <div className="absolute pl-1 pointer-events-none">
    Escribe un mensaje aquí
  </div>
);

export function MessageInput() {
  return (
    <Root>
      <button className="w-11 h-11 p-2 inline-flex rounded-full dark:text-slate-400 text-slate-600">
        <CustomIcon
          icon={Laugh}
          label="Insertar emojis"
          className="w-full h-full"
        />
      </button>
      <AttachFiles />
      <div className="flex-1 relative min-h-[44px] flex overflow-y-auto dark:text-gray-400 text-gray-500 dark:bg-slate-600 bg-white rounded-md">
        <div className="grid items-center w-full max-h-[136px] py-2 max-w-full px-3">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="col-span-1 w-full bg-transparent focus:outline-none dark:text-white text-black" />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
      </div>
      <SendMessage />
      <Plugins />
    </Root>
  );
}
