import dayjs from "dayjs";
import { forwardRef, memo } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { BellOff, Pin } from "lucide-react";

import { ChatItemMenu } from "./ChatItemMenu";
import { Status } from "./Message/Status";
import mc from "@/lib/utils/mergeClassnames";
import { TChat, TMessage } from "@/lib/types";
import { useCurrentChatId, useUserId } from "@/lib/hooks";

const iconVariants = {
  initial: { scale: 0, opacity: 0, y: -10 },
  animate: { scale: 1, opacity: 1, y: 0 },
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

type LastMessageProps = {
  message: TMessage;
  hasUnreadMsg: number | boolean;
};
const LastMessage = (props: LastMessageProps) => {
  const userId = useUserId();
  const { time, body, status, owner } = props.message;
  const isOwnMsg = owner === userId;
  const formatTime = dayjs(time).fromNow(true);
  return (
    <div
      className={mc(
        "w-full flex items-center gap-1 text-sm",
        "text-background-11",
        props.hasUnreadMsg && "text-background-12"
      )}
    >
      {isOwnMsg && (
        <span className="shrink-0 inline-flex">
          <Status status={status} />{" "}
        </span>
      )}
      <p className="flex-1 truncate">{body}</p>
      <span className="shrink-0 mr-1.5">{formatTime}</span>
    </div>
  );
};

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
        "flex select-none cursor-pointer p-2 gap-4 rounded-xl",
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
          <LastMessage message={lastMessage} hasUnreadMsg={hasUnreadMsg} />
        )}
      </div>
    </div>
  );
});
