import { useRef, useEffect } from "react";
import useStore from "../store";
import { Message } from "./Message";

export function Messages() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === state.currentChatId)
  );
  const getAllMessages = useStore((state) => state.getAllMessages);

  if (chat!.shouldLoadOldMsg) {
    getAllMessages();
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, containerRef.current.scrollHeight);
    }
  }, [chat!.messages]);

  return (
    <div
      className="messages overflow-y-auto bg-neutral-200 dark:bg-slate-900"
      ref={containerRef}
    >
      <div className="py-5">
        {chat!.messages.map((message, i, array) => (
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
