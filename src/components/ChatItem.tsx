import {
  BsChevronDown,
  //BsPinAngleFill,
} from "react-icons/bs";
import cx from "classnames";
import { useState } from "react";
import { CustomIcon } from "./CustomIcon";

import { MenuRoot, MenuTrigger, MenuItem, MenuContent } from "./Menu";
import { ContactType, SelectedChatState } from "../types";
import { LastMessage } from "./LastMessage";

type ChatItemProps = {
  contact: ContactType;
} & SelectedChatState;

export function ChatItem({
  contact,
  setSelectedChat,
  selectedChat,
}: ChatItemProps) {
  const { name, picture, lastMessage } = contact;
  const { time } = lastMessage;
  const [openMenu, setOpenMenu] = useState(false);

  if (!lastMessage.isOwnMsg && lastMessage.status !== "read") {
    console.log(lastMessage);
  }
  return (
    <MenuRoot open={openMenu} onOpenChange={setOpenMenu}>
      <div
        onClick={() => {
          if (selectedChat?.name.fullName === name.fullName) return;

          setSelectedChat(contact);
        }}
        className={cx(
          "flex group select-none cursor-pointer border-collapse border-b border-slate-200 dark:border-slate-600 border-solid",
          "dark:bg-slate-800/80 dark:hover:bg-slate-700 bg-white hover:bg-slate-100",
          {
            "dark:bg-slate-700 bg-slate-100":
              selectedChat && name.fullName === selectedChat.name.fullName,
          }
        )}
      >
        <div className="py-2 px-4 overflow-hidden text-gray-400">
          <img
            className="bg-gray-400 w-12 h-12 rounded-full"
            src={picture.thumbnail}
            alt={`Foto de perfil de ${name.fullName}`}
          />
        </div>
        <div className="w-full py-2 pr-4 flex flex-col">
          <div className="flex items-center">
            <p className="flex-1 text-lg dark:text-white">{name.fullName}</p>
            <span className="text-xs dark:text-gray-400 text-gray-500">
              {time}
            </span>
          </div>
          <div className="flex items-center relative">
            <LastMessage lastMessage={lastMessage} />

            <div className="px-0.5 flex items-center w-auto">
              <MenuTrigger
                className={cx(
                  "transition opacity-0 translate-x-full",
                  "group-hover:-translate-x-0 group-hover:opacity-100",
                  { "-translate-x-0 opacity-100": openMenu },
                  "w-4 h-4 ml-2 text-gray-400",
                  "z-10"
                )}
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
            </div>

            {/* 
            TODO: Mostrar cuando la opción "pinear" este disponible en las opciones del chat
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
            <MenuItem>Marcar como leído</MenuItem>
          </MenuContent>
        </div>
      </div>
    </MenuRoot>
  );
}
