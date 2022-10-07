import cx from "classnames";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MenuRoot, MenuTrigger, MenuItem, MenuContent } from "./Menu";
import { CustomIcon } from "./CustomIcon";
import { useContactInfo } from "./ContactInfo";
import useStore from "../store";
import { ChatType } from "../types";

export function ContactMenu({ chat }: { chat: ChatType }) {
  const { openContactInfo, setOpenContactInfo } = useContactInfo();
  const [open, setOpen] = useState<boolean>(false);

  const closeChat = useStore((state) => state.closeChat);
  const muteChat = useStore((state) => state.muteChat);

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
        <MenuItem
          onClick={() => {
            setOpenContactInfo(true);
            setOpen(false);
          }}
        >
          Info. del Contacto
        </MenuItem>
        <MenuItem>Seleccionar mensajes</MenuItem>
        <MenuItem
          onClick={() => {
            if (openContactInfo) setOpenContactInfo(false);

            closeChat();
          }}
        >
          Cerrar chat
        </MenuItem>
        <MenuItem
          onClick={() => {
            muteChat(chat.id);
            setOpen(false);
          }}
        >
          {!chat.isMuted
            ? "Silenciar notificaciones"
            : "Activar notificaciones"}
        </MenuItem>
        <MenuItem>Mensajes temporales</MenuItem>
        <MenuItem>Vaciar mensajes</MenuItem>
        <MenuItem>Eliminar chat</MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
