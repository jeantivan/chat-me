import { ReactNode } from "react";

import {
  LexicalComposer,
  InitialConfigType
} from "@lexical/react/LexicalComposer";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { baseConfig } from "@/editor/baseConfig";

import mc from "@/lib/utils/mergeClassnames";

type RootProps = {
  children: ReactNode;
  initialState: string;
};
function Root({ children, initialState }: RootProps) {
  const editorConfig: InitialConfigType = {
    ...baseConfig,
    namespace: "MessageParser",
    editable: false,
    editorState: initialState
  };
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <>{children}</>
    </LexicalComposer>
  );
}

type Props = {
  body: string;
  className?: string;
};
export function MessageText({ body, className }: Props) {
  return (
    <Root initialState={body}>
      <div className="py-1 px-2">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={mc(
                "whitespace-pre-wrap break-words leading-tight",
                className
              )}
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </Root>
  );
}
