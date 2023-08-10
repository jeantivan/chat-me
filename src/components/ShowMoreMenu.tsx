import {
  Archive,
  Bookmark,
  LogOut,
  MoreVertical,
  Settings,
} from "lucide-react";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./ui/Menu";
import useStore from "@/lib/store";
import { IconButton } from "./ui/IconButton";

export function ShowMoreMenu() {
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);

  return (
    <MenuRoot>
      <MenuTrigger>
        <IconButton icon={MoreVertical} label="Mostrar más" />
      </MenuTrigger>
      <MenuContent align="end" className="w-60">
        <MenuItem
          icon={Archive}
          onClick={() => {
            leftDrawerGoTo("ARCHIVED_CHATS");
          }}
        >
          Chats Archivados
        </MenuItem>
        <MenuItem disabled icon={Bookmark}>
          Mensajes destacados
        </MenuItem>
        <MenuItem
          icon={Settings}
          onClick={() => {
            leftDrawerGoTo("OPTIONS");
          }}
        >
          Configuración
        </MenuItem>

        <MenuItem disabled icon={LogOut}>
          Cerrar sesión
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
