import { forwardRef, memo } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { BellOff, Pin } from "lucide-react";

import { ChatItemMenu } from "./ChatItemMenu";
import { LastMessage } from "./Message/LastMessage";

import mc from "@/lib/utils/mergeClassnames";
import { TChat } from "@/lib/types";
import { useCurrentChatId } from "@/lib/hooks";
import { useChatDisplay } from "@/lib/hooks/useChatCounterpart";
import { router } from "@/routes/router";

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
  const lastMessage = chat.messages[chat.messages.length - 1];
  const isOpenChat = currentChatId === chat.id;

  const { name, picture, isTyping, isOnline } = useChatDisplay(chat);

  return (
    <div
      data-testid={`chat-item-${chat.id}`}
      onClick={() => {
        setCurrentChatId(chat.id);
        router.navigate({ to: "/c/$chatId", params: { chatId: chat.id } });
      }}
      className={mc(
        "flex min-w-0 select-none cursor-pointer p-2 gap-4 rounded-xl mr-2",
        isOpenChat && "bg-primary-4",
        !isOpenChat && "hover:bg-background-4",
        hasUnreadMsg && "font-medium"
      )}
    >
      <div className="flex items-center relative">
        <div className="w-14 h-14 relative">
          <img
            className="bg-background-3 w-full h-full overflow-hidden rounded-full"
            src={picture}
            alt={`Foto de perfil de ${name}`}
            loading="lazy"
          />
          {isOnline && (
            <span
              data-testid="online-indicator"
              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background-1"
            />
          )}
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
        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <div
              data-testid="chat-typing-indicator"
              className="text-sm text-primary-9 font-medium italic animate-pulse flex-1"
            >
              typing...
            </div>
          ) : (
            lastMessage && (
              <div className="flex-1 min-w-0">
                <LastMessage
                  key={lastMessage.id}
                  message={lastMessage}
                  hasUnreadMsg={hasUnreadMsg}
                />
              </div>
            )
          )}
          {typeof hasUnreadMsg === "number" && hasUnreadMsg > 0 && (
            <span
              data-testid="unread-badge"
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-primary-9 text-primary-contrast leading-none shrink-0"
            >
              {hasUnreadMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
