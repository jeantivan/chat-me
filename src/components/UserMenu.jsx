import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import cx from "classnames";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiExit } from "react-icons/bi";
import { IoPeople } from "react-icons/io5";
import { SwitchDarkMode } from "./SwitchDarkMode";
import { Configuration } from "./Configuration";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuIcon } from "./Menu";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  return (
    <MenuRoot open={open} onOpenChange={setOpen}>
      <MenuTrigger
        className={cx(
          "h-8 w-8 rounded-full p-2",
          "dark:text-gray-400 text-gray-500",
          "hover:bg-slate-200 dark:hover:bg-gray-600",
          { "dark:bg-gray-600 bg-gray-200": open }
        )}
      >
        <AccessibleIcon.Root label="Open Menu">
          <BsThreeDotsVertical className="h-full w-full" />
        </AccessibleIcon.Root>
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        <MenuItem className="py-2 px-4 flex items center">
          <div className="flex-1">Nuevo grupo</div>
          <MenuIcon Icon={IoPeople} label="Crear nuevo grupo" />
        </MenuItem>
        <MenuItem>
          <Configuration />
        </MenuItem>
        <MenuItem className="py-2 px-4">
          <SwitchDarkMode />
        </MenuItem>
        <MenuItem className="w-full py-2 px-4">
          <div className="flex-1">Cerrar sesión</div>
          <MenuIcon label="Cerrar sesión" Icon={BiExit} isDanger />
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
