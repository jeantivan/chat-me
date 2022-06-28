import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import cx from "classnames";
import { BsThreeDotsVertical } from "react-icons/bs";
import { INITIAL_CHAT } from "../utils/constants";
import { ContactInfo } from "./ContactInfo";

export function ContactMenu({ selectedChat, setSelectedChat }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger className="h-9 w-9 rounded-full dark:text-gray-400 cursor-pointer text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600 dark:focus:bg-slate-600 p-2">
        <AccessibleIcon.Root label="Open Menu">
          <BsThreeDotsVertical className="h-full w-full" />
        </AccessibleIcon.Root>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        sideOffset={4}
        align="end"
        className={cx(
          "w-56 rounded py-2 shadow-md",
          "bg-white dark:bg-slate-700",
          "z-50"
        )}
      >
        <ul>
          <li className="w-full">
            <ContactInfo selectedChat={selectedChat} />
          </li>
          <li className="w-full py-2 px-4 flex items center  dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            Seleccionar mensajes
          </li>
          <li>
            <button
              onClick={() => {
                setSelectedChat(INITIAL_CHAT);
              }}
              className="w-full py-2 px-4 flex items center dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cerrar chat
            </button>
          </li>
          <li className="w-full py-2 px-4 flex items-stretch dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            Silenciar notificaciones
          </li>
          <li className="w-full py-2 px-4 flex items-stretch dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            Mensajes temporales
          </li>
          <li className="w-full py-2 px-4 flex items-stretch dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            Vaciar mensajes
          </li>
          <li className="w-full py-2 px-4 flex items-stretch dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            Eliminar chat
          </li>
        </ul>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
