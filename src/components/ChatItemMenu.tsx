import { MenuRoot, MenuContent, MenuItem } from "./ui/Menu";
import { Trigger as MenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { CustomIcon } from "./CustomIcon";
import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";

type ChatItemMenuProps = {
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isOpenChat?: boolean;
  chatId: string;
};
export function ChatItemMenu({
  chatId,
  isMuted,
  isPinned,
  isArchived,
  isOpenChat,
}: ChatItemMenuProps) {
  const { archiveChat, deleteChat, closeChat, muteChat, pinChat } = useStore(
    ({ archiveChat, closeChat, deleteChat, muteChat, pinChat }) => ({
      archiveChat,
      closeChat,
      deleteChat,
      muteChat,
      pinChat,
    })
  );
  return (
    <MenuRoot>
      <MenuTrigger
        onClick={(e) => e.stopPropagation()}
        className={mc(
          "p-0.5 outline-none inline-flex rounded-lg",
          "text-background-12 hover:bg-background-5 data-[state=open]:bg-background-6"
        )}
      >
        <CustomIcon
          icon={MoreHorizontal}
          label="Menu del chat"
          className="w-5 h-5"
        />
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            archiveChat(chatId);
          }}
        >
          {isArchived ? "Desarchivar chat" : "Archivar chat"}
        </MenuItem>
        {!isArchived && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              muteChat(chatId);
            }}
          >
            {isMuted ? "Activar notificaciones" : "Silenciar notificaciones"}
          </MenuItem>
        )}
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
              pinChat(chatId);
            }}
          >
            {isPinned ? "Desfijar chat" : "Fijar chat"}
          </MenuItem>
        )}
      </MenuContent>
    </MenuRoot>
  );
}
