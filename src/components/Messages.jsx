import { useRef, useEffect } from "react";
import { Message } from "./Message";

export function Messages({ messages = [] }) {
  const messagesContainer = useRef(null);

  useEffect(() => {
    if (messagesContainer.current) {
      messagesContainer.current.scrollTo(
        0,
        messagesContainer.current.scrollHeight
      );
    }
  }, []);

  return (
    <div
      className="messages overflow-auto bg-neutral-200 dark:bg-slate-900"
      ref={messagesContainer}
    >
      <div className="flex flex-col-reverse justify-start px-20 py-3">
        {messages.map((message, i, array) => {
          if (i === array.length - 1) {
            console.log("Last item");
            return (
              <Message key={message.id} {...message} isFirstMessage={true} />
            );
          }
          return (
            <Message
              key={message.id}
              {...message}
              isFirstMessage={message.type !== array[i + 1].type}
            />
          );
        })}
      </div>
    </div>
  );
}
