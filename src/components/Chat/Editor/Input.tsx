import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";

import { ScrollArea } from "@/components/ui/ScrollArea";

const Placeholder = () => (
  <div className="flex items-center absolute inset-0 pl-1 pointer-events-none text-background-11">
    Escribe un mensaje aquí
  </div>
);

export function Input() {
  return (
    <div className="h-full relative w-full flex items-center mt-1">
      <RichTextPlugin
        contentEditable={
          <ScrollArea
            rootClassName="w-full outline-none pr-2.5"
            className="max-h-[136px] overflow-y-auto w-full bg-transparent outline-none dark:text-white text-black"
          >
            <ContentEditable className="focus:outline-none" />
          </ScrollArea>
        }
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </div>
  );
}
