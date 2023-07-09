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
  <div className="pl-4 absolute w-full h-full inset-0 pointer-events-none flex items-center">
    Escribe un mensaje aquí
  </div>
);

export function MessageInput() {
  return (
    <Root>
      <div className="w-10 h-10 p-1.5 rounded-full dark:text-slate-400 text-slate-600">
        <CustomIcon icon={Laugh} label="Insertar emojis" />
      </div>
      <AttachFiles />
      <div className="flex-1 relative overflow-y-auto dark:text-gray-400 text-gray-500 dark:bg-slate-600 bg-white rounded-md">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="w-full max-h-[136px]  py-2 max-w-full px-3 bg-transparent focus:outline-none dark:text-white text-black" />
          }
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <SendMessage />
      <Plugins />
    </Root>
  );
}
