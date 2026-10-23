import { useRef, useEffect } from "react";
import { Message } from "@/components/Message";

import { TMessage } from "@/lib/types";
import { useCurrentChatId, useUserId } from "@/lib/hooks";
import { ScrollArea } from "@/components/ui/ScrollArea";

type MessagesProps = {
  messages: TMessage[];
  onScrollTop?: () => void;
  isLoadingMore?: boolean;
};

export function Messages({ messages, onScrollTop, isLoadingMore }: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userId = useUserId();
  const { currentChatId } = useCurrentChatId();
  const prevMessagesLength = useRef(messages.length);

  // Auto scroll to bottom only on new messages at the end, not when prepending older pages
  useEffect(() => {
    if (containerRef.current && typeof containerRef.current.scrollTo === "function") {
      if (messages.length > prevMessagesLength.current) {
        containerRef.current.scrollTo(0, containerRef.current.scrollHeight);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [currentChatId, messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop <= 50 && onScrollTop && !isLoadingMore) {
      onScrollTop();
    }
  };

  return (
    <ScrollArea
      ref={containerRef}
      onScroll={handleScroll}
      type="auto"
      rootClassName="messages bg-background-5 bg-[url('/images/pattern.svg')]"
      className="w-full py-5 grid items-end"
    >
      <div className="px-5 grid items-end">
        {isLoadingMore && (
          <div className="text-center py-2 text-xs text-neutral-400">
            Cargando mensajes anteriores...
          </div>
        )}
        {messages.map((message, i, array) => {
          const isOwnMsg = userId === message.owner;
          const hasTail =
            i === 0 || isOwnMsg !== (userId === array[i - 1].owner);

          return (
            <div key={message.id} className="px-[48px]">
              <Message
                isOwnMsg={isOwnMsg}
                hasTail={hasTail}
                message={message}
              />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
