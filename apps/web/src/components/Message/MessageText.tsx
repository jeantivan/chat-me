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
import { isValidLexicalJson, extractPlainText } from "@/lib/utils/lexical";
import useStore from "@/lib/store";

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
  deleted?: boolean;
  className?: string;
};
export function MessageText({ body, deleted, className }: Props) {
  const inChatSearchQuery = useStore((state) => state.inChatSearchQuery);
  const isInChatSearchOpen = useStore((state) => state.isInChatSearchOpen);
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

  const highlightQuery = isInChatSearchOpen ? inChatSearchQuery.trim() : "";

  const renderContent = (text: string) => {
    if (!highlightQuery) return text;
    const escaped = highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === highlightQuery.toLowerCase() ? (
        <mark
          key={index}
          data-testid="search-highlight"
          className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded-xs px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isValidLexicalJson(body)) {
    return (
      <div className="py-1 px-2">
        <div
          className={mc(
            "whitespace-pre-wrap break-words leading-tight",
            className
          )}
        >
          {renderContent(body)}
        </div>
      </div>
    );
  }

  if (highlightQuery) {
    return (
      <div className="py-1 px-2">
        <div
          className={mc(
            "whitespace-pre-wrap break-words leading-tight",
            className
          )}
        >
          {renderContent(extractPlainText(body))}
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
