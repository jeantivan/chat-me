import dayjs from "dayjs";
import { forwardRef, memo } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { BellOff, Pin } from "lucide-react";

import { ChatItemMenu } from "./ChatItemMenu";
import { Status } from "./Message/Status";
import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
import { TChat } from "@/lib/types";
import { useCurrentChatId } from "@/lib/hooks";

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

interface ChatItemProps {
  chat: TChat;
}

export const ChatItem = memo(function ChatItemRoot({ chat }: ChatItemProps) {
  const userId = useStore((state) => state.user.id);
  const { currentChatId, setCurrentChatId } = useCurrentChatId();

  const { hasUnreadMsg } = chat;
  const { name, picture } = chat.participants[0];
  const { time, body, owner, status } = chat.messages[chat.messages.length - 1];

  const formatTime =
    typeof time === "string"
      ? dayjs(time).fromNow(true)
      : dayjs.unix(time).fromNow(true);

  const isOpenChat = currentChatId === chat.id;
  const isOwnMsg = owner === userId;

  return (
    <motion.div
      onClick={() => {
        setCurrentChatId(chat.id);
      }}
      animate="initial"
      initial="initial"
      className={mc(
        "flex select-none cursor-pointer p-2 gap-4 rounded-xl",
        isOpenChat && "dark:bg-emerald-800/70 bg-emerald-200/70",
        !isOpenChat && "dark:hover:bg-slate-700/60 hover:bg-slate-200/60",
        hasUnreadMsg && "font-medium"
      )}
    >
      <div className="flex items-center">
        <div className="w-14 h-14">
          <img
            className="bg-gray-400 w-full h-full overflow-hidden rounded-full"
            src={picture}
            alt={`Foto de perfil de ${name}`}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-2 gap-6">
          <p className="flex-1 text-lg leading-tight truncate dark:text-white">
            {name}
          </p>
          <div className="flex gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {chat.pinned && (
                <AnimateIcon key="pinned-icon">
                  <Pin className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                </AnimateIcon>
              )}
              {chat.muted && (
                <AnimateIcon key="muted-icon">
                  <BellOff className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                </AnimateIcon>
              )}
            </AnimatePresence>
          </div>
          <ChatItemMenu
            chatId={chat.id}
            isMuted={chat.muted}
            isPinned={chat.pinned}
            isOpenChat={isOpenChat}
          />
        </div>
        <div
          className={mc(
            "w-full flex items-center gap-1 text-sm",
            "dark:text-gray-400 text-gray-500",
            hasUnreadMsg && "dark:text-white text-black"
          )}
        >
          {isOwnMsg && (
            <span className="shrink-0 inline-flex">
              <Status status={status} />{" "}
            </span>
          )}
          <p className="truncate">{body}</p>
          <span className="shrink-0 mr-1.5">{formatTime}</span>
        </div>
      </div>
    </motion.div>
  );
});
