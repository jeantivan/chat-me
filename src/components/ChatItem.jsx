import {
  BsChevronDown,
  //BsPinAngleFill,
} from "react-icons/bs";
import cx from "classnames";
import { useState } from "react";
import { CustomIcon } from "./CustomIcon";

import { MenuRoot, MenuTrigger, MenuItem, MenuContent } from "./Menu";

export function ChatItem({ contact, setSelectedChat, selectedChat }) {
  const { name, picture, lastMessage } = contact;
  const { message, time } = lastMessage;
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <MenuRoot open={openMenu} onOpenChange={setOpenMenu}>
      <div
        onClick={() => {
          if (selectedChat.name.fullName === name.fullName) return;

          setSelectedChat(contact);
        }}
        className={cx(
          "flex group select-none border-collapse border-b border-slate-200 dark:border-slate-600 border-solid",
          "dark:bg-slate-800/80 dark:hover:bg-slate-700 bg-white hover:bg-slate-100",
          {
            "dark:bg-slate-700 bg-slate-100":
              name.fullName === selectedChat.name.fullName,
          }
        )}
      >
        <div className="p-2 rounded-full w-16 h-16 overflow-hidden text-gray-400">
          <img
            className="bg-gray-400 w-full h-full rounded-full"
            src={picture.thumbnail}
            alt={`Foto de perfil de ${name.fullName}`}
          />
        </div>
        <div className="flex-1 py-2 px-3 flex flex-col">
          <div className="flex items-center">
            <p className="flex-1 text-lg dark:text-white mb-1">
              {name.fullName}
            </p>
            <span className="text-xs dark:text-gray-400 text-gray-500">
              {time}
            </span>
          </div>
          <div className="flex">
            <p className="text-sm dark:text-gray-400 text-gray-500 line-clamp-1 flex-1">
              {message}
            </p>

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
            <MenuContent align="start" sideOffset={0} className="w-56">
              <MenuItem>Archivar chat</MenuItem>
              <MenuItem>Silenciar notificaciones</MenuItem>
              <MenuItem>Eliminar chat</MenuItem>
              <MenuItem>Fijar chat</MenuItem>
              <MenuItem>Marcar como leído</MenuItem>
            </MenuContent>

            {/* 
            TODO: Mostrar cuando la opción "pinear" este disponible en las opciones del chat
          <CustomIcon
            label="Chat fijado"
            Icon={BsPinAngleFill}
            className="w-4 h-4 ml-2 dark:text-gray-400 text-gray-500"
          /> */}
          </div>
        </div>
      </div>
    </MenuRoot>
  );
}
