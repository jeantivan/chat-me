import { useRef, useEffect } from "react";
import { Message } from "./Message";
import { Loader } from "./Loader";

import useStore from "@/lib/store";
import { MessageType } from "@/lib/types";

interface MessagesProps {
  messages: MessageType[];
  shouldLoadOldMsg: boolean;
}

export function Messages({ messages, shouldLoadOldMsg }: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, containerRef.current.scrollHeight);
    }
  }, [messages]);

  return (
    <div
      className="messages overflow-y-auto bg-neutral-200 dark:bg-slate-900"
      ref={containerRef}
    >
      <div className="py-5">
        {shouldLoadOldMsg && <Loader />}

        {messages.map((message, i, array) => (
          <Message
            key={message.id}
            hasTail={i === 0 || message.isOwnMsg !== array[i - 1].isOwnMsg}
            addOwnReaction={(id: string) => {}}
            deleteOwnReaction={(id: string) => {}}
            changeOwnReaction={(id: string) => {}}
            {...message}
          />
        ))}
      </div>
    </div>
  );
}
