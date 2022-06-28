import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import cx from "classnames";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiExit } from "react-icons/bi";
import { IoPeople } from "react-icons/io5";
import { SwitchDarkMode } from "./SwitchDarkMode";
import { Configuration } from "./Configuration";

export function UserMenu() {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger className="h-8 w-8 rounded-full dark:text-gray-400 cursor-pointer text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600 dark:focus:bg-slate-600 p-2">
        <AccessibleIcon.Root label="Open Menu">
          <BsThreeDotsVertical className="h-full w-full" />
        </AccessibleIcon.Root>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        sideOffset={4}
        align="end"
        className={cx(
          "w-56 rounded-lg py-2 shadow-md z-10",
          "bg-white dark:bg-slate-700"
        )}
      >
        <ul>
          <li className="w-full py-2 px-4 flex items center  dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <div className="flex-1">Nuevo grupo</div>
            <span className="w-6 text-neutral-700 dark:text-neutral-50">
              <AccessibleIcon.Root label="Icono de crear nuevo grupo">
                <IoPeople className="w-full h-full" />
              </AccessibleIcon.Root>
            </span>
          </li>
          <li className="w-full ">
            <Configuration />
          </li>
          <li className="w-full py-2 px-4 flex items center dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <SwitchDarkMode />
          </li>
          <li className="w-full py-2 px-4 flex items-stretch dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <div className="flex-1">Cerrar sesión</div>
            <span className="text-red-600 dark:text-red-700 w-6">
              <AccessibleIcon.Root label="Icono de cerrar sesión">
                <BiExit className="w-full h-full" />
              </AccessibleIcon.Root>
            </span>
          </li>
        </ul>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
