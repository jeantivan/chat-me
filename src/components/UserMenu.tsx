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
        <CustomIcon Icon={BsThreeDotsVertical} label="Abrir menu" />
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        <MenuItem className="py-2 px-4 flex items center">
          <div className="flex-1">Nuevo grupo</div>
        </MenuItem>
        <MenuItem className="py-2 px-4 flex items center">
          <div className="flex-1">Archivados</div>
        </MenuItem>
        <MenuItem className="py-2 px-4 flex items center">
          <div className="flex-1">Mensajes destacados</div>
        </MenuItem>
        <MenuItem>
          <button
            onClick={() => {
              openLeftDrawerAndRenderContent("CONFIGURATION");
            }}
            className="px-4 py-2 flex-1 text-left"
          >
            Configuración
          </button>
        </MenuItem>

        <MenuItem className="w-full py-2 px-4">
          <div className="flex-1">Cerrar sesión</div>
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
