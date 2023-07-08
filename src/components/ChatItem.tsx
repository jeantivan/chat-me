import {
  BsChevronDown,
  BsPinAngleFill,
  BsVolumeMuteFill,
} from "react-icons/bs";
import cx from "classnames";
import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { CustomIcon } from "./CustomIcon";
import { MenuRoot, MenuTrigger, MenuItem, MenuContent } from "./Menu";
import { LastMessage } from "./LastMessage";
import useStore from "@/lib/store";
import { ChatType } from "@/lib/types";

const buttonVariants = {
  hidden: { opacity: 0, x: "100%", transition: { duration: 0.05 } },
  show: { opacity: 1, x: "0%", transition: { duration: 0.05 } },
};

const PinedChat = () => (
  <motion.div
    initial={{ display: "none", scale: 0 }}
    animate={{ display: "block", scale: 1 }}
    exit={{ display: "none", scale: 0 }}
    className="mr-1"
  >
    <CustomIcon
      label="Chat fijado"
      Icon={BsPinAngleFill}
      className="w-4 h-4 inline-block dark:text-gray-400 text-gray-500"
    />
  </motion.div>
);

const MutedChat = () => (
  <motion.div
    initial={{ display: "none", scale: 0 }}
    animate={{ display: "block", scale: 1 }}
    exit={{ display: "none", scale: 0 }}
    className="mr-1"
  >
    <CustomIcon
      label="Chat fijado"
      Icon={BsVolumeMuteFill}
      className="w-5 h-5 inline-block dark:text-gray-400 text-gray-500"
    />
  </motion.div>
);

interface ChatItemProps {
  chat: ChatType;
}

export const ChatItem = memo(function ChatItemRoot({ chat }: ChatItemProps) {
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);
  const { deleteChat, muteChat, pinChat, closeChat } = useStore((state) => ({
    deleteChat: state.deleteChat,
    muteChat: state.muteChat,
    pinChat: state.pinChat,
    closeChat: state.closeChat,
  }));
  const { name, picture } = chat.contact;
  const { messages } = chat;
  const lastMessage = messages[messages.length - 1];
  const { time } = lastMessage;
  const [openMenu, setOpenMenu] = useState(true);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (!openMenu) {
      setShowButton(false);
    }
  }, [openMenu]);

  return (
    <MenuRoot open={openMenu} onOpenChange={setOpenMenu}>
      <motion.div
        onClick={() => {
          setCurrentChatId(chat.id);
        }}
        onHoverStart={() => {
          setShowButton(true);
        }}
        onHoverEnd={() => {
          if (openMenu) return;

          setShowButton(false);
        }}
        className={cx(
          "flex select-none cursor-pointer",
          "dark:bg-slate-800/80 dark:hover:bg-slate-700/60 bg-white hover:bg-slate-100/60",
          {
            "dark:bg-slate-700/80 bg-slate-100": chat.isOpenChat,
          }
        )}
      >
        <div className="py-2 px-4 flex items-center text-gray-400">
          <div className="w-12 h-12">
            <img
              className="bg-gray-400 w-full h-full overflow-hidden rounded-full"
              src={picture.thumbnail}
              alt={`Foto de perfil de ${name}`}
            />
          </div>
        </div>
        <div className="flex flex-col basis-auto justify-center grow min-w-[0] py-2 pr-4 border-b border-slate-200/60 dark:border-slate-600/60 border-solid">
          <div className="flex items-center">
            <p className="flex-1 text-lg dark:text-white">{name}</p>
            <span className="text-xs dark:text-gray-400 text-gray-500">
              {time}
            </span>
          </div>
          <div className="flex items-center mt-1 text-sm dark:text-gray-400 text-gray-500">
            <LastMessage lastMessage={lastMessage} />

            <div className="flex items-center">
              <AnimatePresence>
                {chat.isPinned && <PinedChat />}
                {chat.isMuted && <MutedChat />}

                {showButton && (
                  <motion.div
                    variants={buttonVariants}
                    initial="hidden"
                    exit="hidden"
                    animate={"show"}
                    className="flex items-center"
                  >
                    <MenuTrigger
                      className={cx("w-4 h-4 text-gray-400", "z-10")}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <CustomIcon
                        Icon={BsChevronDown}
                        label="Abrir menu"
                        iconClassName="stroke-1"
                      />
                    </MenuTrigger>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
      <MenuContent align="start" sideOffset={0} className="w-56">
        <MenuItem>Archivar chat</MenuItem>
        <MenuItem
          onClick={() => {
            setOpenMenu(false);
            muteChat(chat.id);
          }}
        >
          {!chat.isMuted
            ? "Silenciar notificaciones"
            : "Activar notificaciones"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenMenu(false);
            if (chat.isOpenChat) closeChat();
            deleteChat(chat.id);
          }}
        >
          Eliminar chat
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenMenu(false);
            pinChat(chat.id);
          }}
        >
          {!chat.isPinned ? "Fijar chat" : "Desfijar chat"}
        </MenuItem>
        <MenuItem>Marcar como leído</MenuItem>
      </MenuContent>
    </MenuRoot>
  );
});
