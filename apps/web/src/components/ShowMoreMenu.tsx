import {
  Archive,
  Bookmark,
  LogOut,
  MoreVertical,
  Settings,
  Users,
} from "lucide-react";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./ui/Menu";
import useStore from "@/lib/store";
import { useAuth } from "@/lib/auth/AuthContext";
import { IconButton } from "./ui/IconButton";

export function ShowMoreMenu() {
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  const { logout } = useAuth();

  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton icon={MoreVertical} label="Mostrar más" />
      </MenuTrigger>
      <MenuContent align="end" className="w-60">
        <MenuItem
          icon={Users}
          onClick={() => {
            leftDrawerGoTo("NEW_GROUP");
          }}
        >
          Nuevo grupo
        </MenuItem>
        <MenuItem
          icon={Archive}
          onClick={() => {
            leftDrawerGoTo("ARCHIVED_CHATS");
          }}
        >
          Chats Archivados
        </MenuItem>
        <MenuItem
          icon={Bookmark}
          onClick={() => {
            leftDrawerGoTo("STARRED_MESSAGES");
          }}
        >
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

        <MenuItem
          icon={LogOut}
          onClick={() => {
            logout();
          }}
        >
          Cerrar sesión
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
