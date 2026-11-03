import { useState } from "react";
import { MoreVerticalIcon, Search, Users, X } from "lucide-react";
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
import { useChatDisplay } from "@/lib/hooks/useChatCounterpart";
import { useUpdateChatParticipant } from "@/lib/api/chatQueries";
import { UserImage } from "@/components/UserImage";
import { ClearChatDialog } from "./ClearChatDialog";
import { DeleteChatDialog } from "./DeleteChatDialog";

dayjs.extend(relativeTime);

const Content = ({
  chatId,
  isMuted,
  onOpenClear,
  onOpenDelete,
}: {
  chatId: string;
  isMuted?: boolean;
  onOpenClear: () => void;
  onOpenDelete: () => void;
}) => {
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const closeChat = useStore((state) => state.closeChat);
  const updateParticipant = useUpdateChatParticipant();
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
      <MenuItem
        onClick={(e) => {
          e.stopPropagation();
          rightDrawerGoTo("SHARED_CONTENT");
        }}
      >
        Archivos
      </MenuItem>

      <MenuItem
        onClick={(e) => {
          e.stopPropagation();
          updateParticipant.mutate({ chatId, muted: !isMuted });
        }}
      >
        {isMuted ? "Activar notificaciones" : "Silenciar notificaciones"}
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
          onOpenClear();
        }}
      >
        Vaciar chat
      </MenuItem>

      <MenuItem
        onClick={(e) => {
          e.stopPropagation();
          onOpenDelete();
        }}
      >
        Eliminar chat
      </MenuItem>
    </MenuContent>
  );
};

export function Header({ chat }: { chat: TChat }) {
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const isInChatSearchOpen = useStore((state) => state.isInChatSearchOpen);
  const toggleInChatSearch = useStore((state) => state.toggleInChatSearch);
  const inChatSearchQuery = useStore((state) => state.inChatSearchQuery);
  const setInChatSearchQuery = useStore((state) => state.setInChatSearchQuery);
  const clearInChatSearchQuery = useStore((state) => state.clearInChatSearchQuery);

  const { name, picture, isTyping, presence, isGroup } = useChatDisplay(chat);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <header className="chat-header bg-background-2 shadow-lg">
      <div className="flex items-center px-5 py-2">
        <button
          className="flex-1 flex items-center"
          onClick={() => {
            rightDrawerGoTo("CONTACT_INFO");
          }}
        >
          <span className="w-10 h-10 rounded-full mr-3 shrink-0">
            <UserImage
              src={picture}
              alt={`Foto de perfil de ${name}`}
              className="w-full h-full"
              fallback={
                isGroup ? (
                  <Users className="w-full h-full p-2 text-neutral-400" />
                ) : undefined
              }
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
            ) : isGroup ? (
              <span
                data-testid="header-participant-summary"
                className="text-xs text-background-11 line-clamp-1 leading-tight"
              >
                {chat.participants.map((p) => p.name).join(", ")}
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
          <IconButton
            data-testid="toggle-in-chat-search"
            icon={Search}
            label="Buscar"
            onClick={() => toggleInChatSearch()}
          />
          <MenuRoot>
            <MenuTrigger asChild>
              <IconButton icon={MoreVerticalIcon} label="Abrir menu del chat" />
            </MenuTrigger>
            <Content
              chatId={chat.id}
              isMuted={chat.muted}
              onOpenClear={() => setIsClearOpen(true)}
              onOpenDelete={() => setIsDeleteOpen(true)}
            />
          </MenuRoot>
        </div>
      </div>
      {isInChatSearchOpen && (
        <div
          data-testid="in-chat-search-bar"
          className="flex items-center px-5 py-2 bg-background-3 border-t border-background-5 gap-2"
        >
          <Search className="w-4 h-4 text-background-11 shrink-0" />
          <input
            data-testid="in-chat-search-input"
            type="text"
            value={inChatSearchQuery}
            onChange={(e) => setInChatSearchQuery(e.target.value)}
            placeholder="Buscar en el chat"
            className="flex-1 bg-transparent text-sm text-background-12 placeholder:text-background-10 focus:outline-none"
            autoFocus
          />
          {inChatSearchQuery.length > 0 && (
            <button
              type="button"
              data-testid="clear-in-chat-search"
              aria-label="Clear in-chat search"
              onClick={clearInChatSearchQuery}
              className="p-1 text-background-10 hover:text-background-12 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            data-testid="close-in-chat-search"
            aria-label="Close search"
            onClick={() => toggleInChatSearch(false)}
            className="p-1 text-background-10 hover:text-background-12 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      <ClearChatDialog
        chatId={chat.id}
        open={isClearOpen}
        onOpenChange={setIsClearOpen}
      />
      <DeleteChatDialog
        chatId={chat.id}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </header>
  );
}
