import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import cx from "classnames";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { INITIAL_CHAT } from "../utils/constants";
import { ContactInfo } from "./ContactInfo";
import { MenuRoot, MenuTrigger, MenuItem, MenuContent } from "./Menu";
import { CustomIcon } from "./CustomIcon";

export function ContactMenu({ selectedChat, setSelectedChat }) {
  const [open, setOpen] = useState(false);
  return (
    <MenuRoot open={open} onOpenChange={setOpen}>
      <MenuTrigger
        className={cx(
          "h-9 w-9 rounded-full p-2 cursor-pointer",
          "dark:text-gray-400 text-gray-500 hover:bg-slate-200 dark:hover:bg-gray-600",
          { "dark:bg-gray-600 bg-gray-200": open }
        )}
        title="Abrir menu"
      >
        <CustomIcon Icon={BsThreeDotsVertical} label="Abrir menu" />
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        <MenuItem>
          <ContactInfo selectedChat={selectedChat} />
        </MenuItem>
        <MenuItem>Seleccionar mensajes</MenuItem>
        <MenuItem>
          <button
            onClick={() => {
              setSelectedChat(INITIAL_CHAT);
            }}
            className="py-2 px-4"
          >
            Cerrar chat
          </button>
        </MenuItem>
        <MenuItem>Silenciar notificaciones</MenuItem>
        <MenuItem>Mensajes temporales</MenuItem>
        <MenuItem>Vaciar mensajes</MenuItem>
        <MenuItem>Eliminar chat</MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
