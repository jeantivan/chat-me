import cx from "classnames";
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./Menu";
import { IconButton } from "./ui/IconButton";
import useStore from "@/lib/store";

export function UserMenu() {
  const [open, setOpen] = useState(false);

  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);

  return (
    <MenuRoot open={open} onOpenChange={setOpen}>
      <MenuTrigger
        asChild
        className={cx(open && "dark:bg-gray-600 bg-gray-200")}
      >
        <IconButton icon={MoreVertical} label="Abrir menu" />
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        <MenuItem>Nuevo grupo</MenuItem>
        <MenuItem>Archivados</MenuItem>
        <MenuItem>Mensajes destacados</MenuItem>
        <MenuItem
          onClick={() => {
            leftDrawerGoTo("OPTIONS");
          }}
        >
          Configuración
        </MenuItem>

        <MenuItem>Cerrar sesión</MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
