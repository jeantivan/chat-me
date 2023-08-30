import { forwardRef, memo } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { BellOff, Pin } from "lucide-react";

import { ChatItemMenu } from "./ChatItemMenu";
import { LastMessage } from "./Message/LastMessage";

import mc from "@/lib/utils/mergeClassnames";
import { TChat } from "@/lib/types";
import { useCurrentChatId } from "@/lib/hooks";

const iconVariants = {
  initial: { scale: 0, opacity: 0, y: -10 },
  animate: { scale: 1, opacity: 1, y: 0 }
};
const AnimateIcon = forwardRef<HTMLSpanElement, HTMLMotionProps<"span">>(
  ({ children }, ref) => (
    <motion.span
      variants={iconVariants}
      initial="initial"
      animate="animate"
      exit="initial"
      className="inline-flex"
      ref={ref}
    >
      {children}
    </motion.span>
  )
);

interface ChatItemProps {
  chat: TChat;
}
export const ChatItem = memo(function ChatItemRoot({ chat }: ChatItemProps) {
  const { currentChatId, setCurrentChatId } = useCurrentChatId();

  const { hasUnreadMsg } = chat;
  const { name, picture } = chat.participants[0];
  const lastMessage = chat.messages[chat.messages.length - 1];

  const isOpenChat = currentChatId === chat.id;

  return (
    <div
      onClick={() => {
        setCurrentChatId(chat.id);
      }}
      className={mc(
        "flex min-w-0 select-none cursor-pointer p-2 gap-4 rounded-xl mr-2",
        isOpenChat && "bg-primary-4",
        !isOpenChat && "hover:bg-background-4",
        hasUnreadMsg && "font-medium"
      )}
    >
      <div className="flex items-center">
        <div className="w-14 h-14">
          <img
            className="bg-background-3 w-full h-full overflow-hidden rounded-full"
            src={picture}
            alt={`Foto de perfil de ${name}`}
            loading="lazy"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-2 gap-6">
          <p className="flex-1 text-lg leading-tight truncate dark:text-background-12">
            {name}
          </p>
          <div className="flex gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {chat.pinned && (
                <AnimateIcon key="pinned-icon">
                  <Pin className="w-4 h-4 text-background-10" />
                </AnimateIcon>
              )}
              {chat.muted && (
                <AnimateIcon key="muted-icon">
                  <BellOff className="w-4 h-4 text-background-10" />
                </AnimateIcon>
              )}
            </AnimatePresence>
          </div>
          <ChatItemMenu
            chatId={chat.id}
            isMuted={chat.muted}
            isPinned={chat.pinned}
            isArchived={chat.archived}
            isOpenChat={isOpenChat}
          />
        </div>
        {lastMessage && (
          <LastMessage
            key={lastMessage.id}
            message={lastMessage}
            hasUnreadMsg={hasUnreadMsg}
          />
        )}
      </div>
    </div>
  );
});
