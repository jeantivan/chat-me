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

function isValidLexicalJson(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  if (!str.startsWith("{") || !str.endsWith("}")) return false;
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null && "root" in parsed;
  } catch {
    return false;
  }
}

type Props = {
  body: string;
  className?: string;
};
export function MessageText({ body, className }: Props) {
  if (!isValidLexicalJson(body)) {
    return (
      <div className="py-1 px-2">
        <div
          className={mc(
            "whitespace-pre-wrap break-words leading-tight",
            className
          )}
        >
          {body}
        </div>
      </div>
    );
  }

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
