import { ReactNode } from "react";

import { MenuTrigger, MenuContent, MenuItem, MenuRoot } from "./ui/Menu";

import useStore from "@/lib/store";

export function ChatHeaderMenu({ children }: { children: ReactNode }) {
  const currentChatId = useStore((state) => state.currentChatId);
  const { muteChat, closeChat, deleteChat } = useStore(
    ({ muteChat, closeChat, deleteChat }) => ({
      muteChat,
      closeChat,
      deleteChat,
    })
  );
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  return (
    <MenuRoot>
      <MenuTrigger asChild>{children}</MenuTrigger>

      <MenuContent>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            rightDrawerGoTo("CONTACT_INFO");
          }}
        >
          Info de contacto
        </MenuItem>
        <MenuItem disabled>Archivos</MenuItem>
        {/* TODO: <MenuItem>Estadísticas</MenuItem> */}

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            muteChat(currentChatId!);
          }}
        >
          Silenciar notificaciones
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            closeChat();
          }}
        >
          Cerrar chat
        </MenuItem>

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            deleteChat(currentChatId!);
          }}
        >
          Eliminar chat
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
