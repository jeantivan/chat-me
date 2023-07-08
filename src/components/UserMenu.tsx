import cx from "classnames";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./Menu";
import { CustomIcon } from "./CustomIcon";
import { useLeftDrawer } from "./LeftDrawer";

export function UserMenu() {
  const [open, setOpen] = useState(false);

  const { openLeftDrawerAndRenderContent } = useLeftDrawer();

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
        <CustomIcon icon={BsThreeDotsVertical} label="Abrir menu" />
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        <MenuItem>Nuevo grupo</MenuItem>
        <MenuItem>Archivados</MenuItem>
        <MenuItem>Mensajes destacados</MenuItem>
        <MenuItem
          onClick={() => {
            openLeftDrawerAndRenderContent("CONFIGURATION");
          }}
        >
          Configuración
        </MenuItem>

        <MenuItem>Cerrar sesión</MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
