import cx from "classnames";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { INITIAL_CHAT } from "../utils/constants";
//import { ContactInfo } from "./ContactInfo";
import { MenuRoot, MenuTrigger, MenuItem, MenuContent } from "./Menu";
import { CustomIcon } from "./CustomIcon";
import { useContactInfo } from "./ContactInfo";

export function ContactMenu({ setSelectedChat }) {
  const { openContactInfo, setOpenContactInfo } = useContactInfo();
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
          <button
            onClick={() => {
              setOpenContactInfo(true);
              setOpen(false);
            }}
            className="w-full py-2 px-4 text-left"
          >
            Info. del Contacto
          </button>
        </MenuItem>
        <MenuItem>Seleccionar mensajes</MenuItem>
        <MenuItem>
          <button
            onClick={() => {
              if (openContactInfo) setOpenContactInfo(false);
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
