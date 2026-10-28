import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ReactNode } from "react";

dayjs.extend(relativeTime);

import { Status } from "./Status";

import {
  InitialConfigType,
  LexicalComposer
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { baseConfig } from "@/editor/baseConfig";

import mc from "@/lib/utils/mergeClassnames";
import { useUserId } from "@/lib/hooks";
import { TMessage } from "@/lib/types";
import { DELETED_MESSAGE_TOMBSTONE } from "@chat-me/shared";
import { isValidLexicalJson } from "@/lib/utils/lexical";

type RootProps = {
  children: ReactNode;
  initialState: string;
};
function Root({ children, initialState }: RootProps) {
  const editorConfig: InitialConfigType = {
    ...baseConfig,
    namespace: "LastMessageParser",
    editable: false,
    editorState: initialState
  };
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <>{children}</>
    </LexicalComposer>
  );
}

type LastMessageProps = {
  message: TMessage;
  hasUnreadMsg: number | boolean;
};
export function LastMessage({ message, hasUnreadMsg }: LastMessageProps) {
  const userId = useUserId();
  const { time, body, status, owner, deleted, hasMedia } = message;
  const isOwnMsg = owner === userId;
  const formatTime = dayjs(time).fromNow(true);

  const isTombstone = Boolean(deleted) || body === DELETED_MESSAGE_TOMBSTONE;

  if (isTombstone) {
    return (
      <div
        className={mc(
          "w-full flex items-center gap-1 text-sm",
          "text-background-11",
          hasUnreadMsg && "text-background-12"
        )}
      >
        {isOwnMsg && (
          <Status className="shrink-0 inline-flex" status={status} />
        )}
        <span
          data-testid="last-message-tombstone"
          className="flex-1 line-clamp-1 italic text-neutral-500 dark:text-neutral-400"
        >
          {body || DELETED_MESSAGE_TOMBSTONE}
        </span>
        <span className="shrink-0 mr-1">{formatTime}</span>
      </div>
    );
  }

  if (!isValidLexicalJson(body)) {
    return (
      <div
        className={mc(
          "w-full flex items-center gap-1 text-sm",
          "text-background-11",
          hasUnreadMsg && "text-background-12"
        )}
      >
        {isOwnMsg && (
          <Status className="shrink-0 inline-flex" status={status} />
        )}
        <span className="flex-1 line-clamp-1 truncate">
          {body || (hasMedia ? hasMedia.type : "")}
        </span>
        <span className="shrink-0 mr-1">{formatTime}</span>
      </div>
    );
  }

  return (
    <Root initialState={body}>
      <div
        className={mc(
          "w-full flex items-center gap-1 text-sm",
          "text-background-11",
          hasUnreadMsg && "text-background-12"
        )}
      >
        {isOwnMsg && (
          <Status className="shrink-0 inline-flex" status={status} />
        )}
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="pointer-events-none flex-1 line-clamp-1" />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <span className="shrink-0 mr-1">{formatTime}</span>
      </div>
    </Root>
  );
}
