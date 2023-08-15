import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Message } from "@/components/Message";

import { TMessage } from "@/lib/types";
import { useCurrentChatId, useUserId } from "@/lib/hooks";
import useStore from "@/lib/store";
import { ScrollArea } from "@/components/ui/ScrollArea";

type MessagesProps = {
  messages: TMessage[];
};
export function Messages({ messages }: MessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightDrawer = useStore((state) => state.rightDrawer);
  const userId = useUserId();
  const { currentChatId } = useCurrentChatId();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, containerRef.current.scrollHeight);
    }
  }, [containerRef.current, currentChatId, messages.length]);

  return (
    <ScrollArea
      ref={containerRef}
      rootClassName="messages bg-background-5 bg-[url('/images/pattern.svg')]"
      className="w-full py-5"
    >
      <div className="px-5 grid items-end">
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
