import { MoreVerticalIcon, Search } from "lucide-react";

import {
  MenuContent,
  MenuItem,
  MenuTrigger,
  MenuRoot,
} from "@/components/ui/Menu";
import { IconButton } from "@/components/ui/IconButton";
import { TChat } from "@/lib/types";
import useStore from "@/lib/store";
import { useChatActions } from "@/lib/hooks";

const Content = ({ chatId }: { chatId: string }) => {
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const { muteChat, deleteChat, closeChat } = useChatActions();
  return (
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
          muteChat(chatId);
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
          deleteChat(chatId);
        }}
      >
        Eliminar chat
      </MenuItem>
    </MenuContent>
  );
};

export function Header({ chat }: { chat: TChat }) {
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const { name, picture } = chat.participants[0];

  return (
    <header className="chat-header bg-background-2 shadow-lg">
      <div className="flex items-center px-5 py-2">
        <button
          className="flex-1 flex items-stretch"
          onClick={() => {
            rightDrawerGoTo("CONTACT_INFO");
          }}
        >
          <span className="text-gray-400 w-10 h-10 rounded-full mr-3">
            <img
              className="bg-gray-400 w-full h-full rounded-full"
              src={picture}
              alt={`Foto de perfil de ${name}`}
            />
          </span>
          <span className="flex items-center">
            <span className="font-bold dark:text-white leading-none">
              {name}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <IconButton icon={Search} label="Buscar" />
          <MenuRoot>
            <MenuTrigger asChild>
              <IconButton icon={MoreVerticalIcon} label="Abrir menu del chat" />
            </MenuTrigger>
            <Content chatId={chat.id} />
          </MenuRoot>
        </div>
      </div>
    </header>
  );
}
