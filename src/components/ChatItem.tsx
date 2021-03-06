import {
  BsChevronDown,
  //BsPinAngleFill,
} from "react-icons/bs";
import cx from "classnames";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomIcon } from "./CustomIcon";

import { MenuRoot, MenuTrigger, MenuItem, MenuContent } from "./Menu";
import { ContactType, SelectedChatState } from "../types";
import { LastMessage } from "./LastMessage";

type ChatItemProps = {
  contact: ContactType;
} & SelectedChatState;

const buttonVariants = {
  hidden: { opacity: 0, x: "100%", transition: { duration: 0.05 } },
  show: { opacity: 1, x: "0%", transition: { duration: 0.05 } },
};

export function ChatItem({
  contact,
  setSelectedChat,
  selectedChat,
}: ChatItemProps) {
  const { name, picture, lastMessage } = contact;
  const { time } = lastMessage;
  const [openMenu, setOpenMenu] = useState(true);
  const [showButton, setShowButton] = useState(false);

  const handleClick = () => {
    if (selectedChat?.name.fullName === name.fullName) return;

    setSelectedChat(contact);
  };

  if (!lastMessage.isOwnMsg && lastMessage.status !== "read") {
    console.log(lastMessage);
  }

  useEffect(() => {
    if (!openMenu) {
      setShowButton(false);
    }
  }, [openMenu]);

  return (
    <MenuRoot open={openMenu} onOpenChange={setOpenMenu}>
      <motion.div
        onClick={handleClick}
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
            "dark:bg-slate-700 bg-slate-100":
              selectedChat && name.fullName === selectedChat.name.fullName,
          }
        )}
      >
        <div className="py-2 px-4 flex items-center text-gray-400">
          <div className="w-12 h-12">
            <img
              className="bg-gray-400 w-full h-full overflow-hidden rounded-full"
              src={picture.thumbnail}
              alt={`Foto de perfil de ${name.fullName}`}
            />
          </div>
        </div>
        <div className="flex flex-col basis-auto justify-center grow min-w-[0] py-2 pr-4 border-b border-slate-200/60 dark:border-slate-600/60 border-solid">
          <div className="flex items-center">
            <p className="flex-1 text-lg dark:text-white">{name.fullName}</p>
            <span className="text-xs dark:text-gray-400 text-gray-500">
              {time}
            </span>
          </div>
          <div className="flex items-center mt-1 text-sm dark:text-gray-400 text-gray-500">
            <LastMessage lastMessage={lastMessage} />

            <div>
              <AnimatePresence>
                {showButton && (
                  <motion.div
                    variants={buttonVariants}
                    initial="hidden"
                    exit="hidden"
                    animate={"show"}
                    className="flex items-center"
                  >
                    <MenuTrigger
                      className={cx("w-4 h-4 ml-2 text-gray-400", "z-10")}
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

            {/* 
            TODO: Mostrar cuando la opci??n "pinear" este disponible en las opciones del chat
          <CustomIcon
            label="Chat fijado"
            Icon={BsPinAngleFill}
            className="w-4 h-4 ml-2 dark:text-gray-400 text-gray-500"
          /> */}
          </div>
          <MenuContent align="start" sideOffset={0} className="w-56">
            <MenuItem>Archivar chat</MenuItem>
            <MenuItem>Silenciar notificaciones</MenuItem>
            <MenuItem>Eliminar chat</MenuItem>
            <MenuItem>Fijar chat</MenuItem>
            <MenuItem>Marcar como le??do</MenuItem>
          </MenuContent>
        </div>
      </motion.div>
    </MenuRoot>
  );
}
