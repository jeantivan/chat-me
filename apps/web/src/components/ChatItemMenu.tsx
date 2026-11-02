import { Trigger as MenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { MenuRoot, MenuContent, MenuItem } from "./ui/Menu";
import { Icon } from "./ui/Icon";
import mc from "@/lib/utils/mergeClassnames";
import { useChatActions } from "@/lib/hooks";
import { useUpdateChatParticipant } from "@/lib/api/chatQueries";

type ChatItemMenuProps = {
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isUnread?: boolean;
  isOpenChat?: boolean;
  chatId: string;
};

export function ChatItemMenu({
  chatId,
  isMuted,
  isPinned,
  isArchived,
  isUnread,
  isOpenChat,
}: ChatItemMenuProps) {
  const { deleteChat, closeChat } = useChatActions();
  const updateParticipant = useUpdateChatParticipant();

  return (
    <MenuRoot>
      <MenuTrigger
        onClick={(e) => e.stopPropagation()}
        className={mc(
          "p-0.5 outline-none inline-flex rounded-lg",
          "text-background-12 hover:bg-background-5 data-[state=open]:bg-background-6"
        )}
      >
        <Icon icon={MoreHorizontal} label="Menu del chat" className="w-5 h-5" />
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            updateParticipant.mutate({ chatId, archived: !isArchived });
          }}
        >
          {isArchived ? "Desarchivar chat" : "Archivar chat"}
        </MenuItem>
        {!isArchived && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              updateParticipant.mutate({ chatId, muted: !isMuted });
            }}
          >
            {isMuted ? "Activar notificaciones" : "Silenciar notificaciones"}
          </MenuItem>
        )}
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            updateParticipant.mutate({ chatId, markedUnread: !isUnread });
          }}
        >
          {isUnread ? "Marcar como leído" : "Marcar como no leído"}
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            if (isOpenChat) closeChat();
            deleteChat(chatId);
          }}
        >
          Eliminar chat
        </MenuItem>
        {!isArchived && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              updateParticipant.mutate({ chatId, pinned: !isPinned });
            }}
          >
            {isPinned ? "Desfijar chat" : "Fijar chat"}
          </MenuItem>
        )}
      </MenuContent>
    </MenuRoot>
  );
}
