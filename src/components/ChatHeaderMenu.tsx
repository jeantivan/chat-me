import { MoreVertical } from "lucide-react";
import { MenuTrigger, MenuContent, MenuItem, MenuRoot } from "./ui/Menu";

import useStore from "@/lib/store";

export function ChatHeaderMenu() {
  const currentChatId = useStore((state) => state.currentChatId);
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  return (
    <MenuRoot>
      <MenuTrigger icon={MoreVertical} label="Abrir menu del chat" />

      <MenuContent>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            rightDrawerGoTo("CONTACT_INFO");
          }}
        >
          Info de contacto
        </MenuItem>
        <MenuItem>Archivos</MenuItem>
        {/* TODO: <MenuItem>Estadísticas</MenuItem> */}

        <MenuItem>Silenciar notificaciones</MenuItem>
        <MenuItem>Vaciar chat</MenuItem>
        <MenuItem>Eliminar chat</MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
