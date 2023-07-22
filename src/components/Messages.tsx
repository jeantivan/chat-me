import { useRef, useEffect } from "react";
import { Message } from "./Message";

import { TMessage } from "@/lib/types";
import { useUserId } from "@/lib/hooks";

type MessagesProps = {
  messages: TMessage[];
};

export function Messages({ messages }: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userId = useUserId();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, containerRef.current.scrollHeight);
    }
  }, [messages, containerRef.current]);

  return (
    <div
      className="messages overflow-x-hidden overflow-y-scroll bg-slate-200 dark:bg-slate-900 py-5 grid items-end"
      ref={containerRef}
    >
      {messages.map((message, i, array) => {
        const isOwnMsg = userId === message.owner;
        const hasTail = i === 0 || isOwnMsg !== (userId === array[i - 1].owner);

        return (
          <Message
            key={message.id}
            isOwnMsg={isOwnMsg}
            hasTail={hasTail}
            message={message}
          />
        );
      })}
    </div>
  );
}
