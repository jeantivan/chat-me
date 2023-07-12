import { forwardRef, memo } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { BellOff, Pin } from "lucide-react";

import { LastMessage } from "./LastMessage";
import { ChatItemMenu } from "./ChatItemMenu";
import { ChatType } from "@/lib/types";
import useStore from "@/lib/store";
import mc from "@/lib/utils/mergeClassnames";

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
  chat: ChatType;
}

export const ChatItem = memo(function ChatItemRoot({ chat }: ChatItemProps) {
  const { currentChatId, setCurrentChatId } = useStore(
    ({ currentChatId, setCurrentChatId }) => ({
      currentChatId,
      setCurrentChatId,
    })
  );

  const { name, picture } = chat.contact;
  const { messages } = chat;
  const lastMessage = messages[messages.length - 1];
  const { time } = lastMessage;

  const isOpenChat = currentChatId === chat.id;

  return (
    <motion.div
      onClick={() => {
        setCurrentChatId(chat.id);
      }}
      animate="initial"
      initial="initial"
      className={mc(
        "flex select-none cursor-pointer p-2 gap-4 rounded-lg",
        "dark:bg-slate-800 bg-slate-50",
        !isOpenChat && "dark:hover:bg-slate-700/60 hover:bg-slate-200/60",
        isOpenChat && "dark:bg-emerald-700/80 bg-emerald-200/80"
      )}
    >
      <div className="flex items-center text-gray-400">
        <div className="w-12 h-12">
          <img
            className="bg-gray-400 w-full h-full overflow-hidden rounded-full"
            src={picture.thumbnail}
            alt={`Foto de perfil de ${name}`}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-2 gap-6">
          <p className="flex-1 text-lg dark:text-white">{name}</p>
          <div className="flex gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {chat.isPinned && (
                <AnimateIcon key="pinned-icon">
                  <Pin className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                </AnimateIcon>
              )}
              {chat.isMuted && (
                <AnimateIcon key="muted-icon">
                  <BellOff className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                </AnimateIcon>
              )}
            </AnimatePresence>
          </div>
          <ChatItemMenu
            chatId={chat.id}
            isMuted={chat.isMuted}
            isPinned={chat.isPinned}
            isOpenChat={isOpenChat}
          />
        </div>
        <div className="w-full flex items-center gap-1 text-sm dark:text-gray-400 text-gray-500">
          <LastMessage lastMessage={lastMessage} />
          <span>{time}</span>
        </div>
      </div>
    </motion.div>
  );
});
