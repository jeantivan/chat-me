import { useState } from "react";
import { MoreVerticalIcon, Search, Users } from "lucide-react";
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
  const { closeChat } = useChatActions();
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
      <MenuItem disabled>Archivos</MenuItem>

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
          <IconButton icon={Search} label="Buscar" />
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
