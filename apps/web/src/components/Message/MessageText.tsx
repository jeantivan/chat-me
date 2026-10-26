import { ReactNode } from "react";

import {
  LexicalComposer,
  InitialConfigType
} from "@lexical/react/LexicalComposer";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { baseConfig } from "@/editor/baseConfig";

import { DELETED_MESSAGE_TOMBSTONE } from "@chat-me/shared";
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
  deleted?: boolean;
  className?: string;
};
export function MessageText({ body, deleted, className }: Props) {
  const isTombstone = Boolean(deleted) || body === DELETED_MESSAGE_TOMBSTONE;

  if (isTombstone) {
    return (
      <div className="py-1 px-2">
        <div
          data-testid="tombstone-message"
          className={mc(
            "whitespace-pre-wrap break-words leading-tight italic text-neutral-500 dark:text-neutral-400",
            className
          )}
        >
          {body}
        </div>
      </div>
    );
  }

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
