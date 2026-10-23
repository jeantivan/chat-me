import { MoreVerticalIcon, Search } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

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
import { useChatCounterpart } from "@/lib/hooks/useChatCounterpart";

dayjs.extend(relativeTime);

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
  const { name, picture, isTyping, presence } = useChatCounterpart(chat);

  return (
    <header className="chat-header bg-background-2 shadow-lg">
      <div className="flex items-center px-5 py-2">
        <button
          className="flex-1 flex items-center"
          onClick={() => {
            rightDrawerGoTo("CONTACT_INFO");
          }}
        >
          <span className="text-gray-400 w-10 h-10 rounded-full mr-3 shrink-0">
            <img
              className="bg-gray-400 w-full h-full rounded-full"
              src={picture}
              alt={`Foto de perfil de ${name}`}
            />
          </span>
          <span className="flex flex-col items-start justify-center text-left">
            <span className="font-bold dark:text-white leading-tight">
              {name}
            </span>
            {isTyping ? (
              <span
                data-testid="header-typing-indicator"
                className="text-xs text-primary-9 font-medium italic leading-tight animate-pulse"
              >
                typing...
              </span>
            ) : presence?.status === "online" ? (
              <span
                data-testid="presence-indicator"
                className="text-xs text-green-500 font-medium flex items-center gap-1 leading-tight"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                online
              </span>
            ) : (
              <span
                data-testid="presence-indicator"
                className="text-xs text-background-11 leading-tight"
              >
                {presence?.lastSeenAt
                  ? `last seen ${dayjs(presence.lastSeenAt).fromNow()}`
                  : "offline"}
              </span>
            )}
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
