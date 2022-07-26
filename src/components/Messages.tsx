import { useRef, useEffect } from "react";
import { Message } from "./Message";
import { MessageType } from "../types";

interface MessagesProps {
  messages: Array<MessageType>;
}

export function Messages({ messages }: MessagesProps) {
  const messagesContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainer.current) {
      messagesContainer.current.scrollTo(
        0,
        messagesContainer.current.scrollHeight
      );
    }
  }, [messages]);

  return (
    <div
      className="messages overflow-y-auto bg-neutral-200 dark:bg-slate-900"
      ref={messagesContainer}
    >
      <div className="flex flex-col-reverse py-5">
        {messages.map((message, i, array) => {
          if (i === array.length - 1) {
            return (
              <Message key={message.id} {...message} isFirstMessage={true} />
            );
          }
          return (
            <Message
              key={message.id}
              {...message}
              isFirstMessage={message.isOwnMsg !== array[i + 1].isOwnMsg}
            />
          );
        })}
      </div>
    </div>
  );
}
