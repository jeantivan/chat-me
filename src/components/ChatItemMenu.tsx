import { MenuRoot, MenuContent, MenuItem } from "./ui/Menu";
import { Trigger as MenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { CustomIcon } from "./CustomIcon";
import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";

type ChatItemMenuProps = {
  isMuted: boolean;
  isPinned: boolean;
  isOpenChat: boolean;
  chatId: string;
};
export function ChatItemMenu({
  chatId,
  isMuted,
  isPinned,
  isOpenChat,
}: ChatItemMenuProps) {
  const { deleteChat, muteChat, pinChat, closeChat } = useStore(
    ({ deleteChat, muteChat, pinChat, closeChat }) => ({
      deleteChat,
      muteChat,
      pinChat,
      closeChat,
    })
  );
  return (
    <MenuRoot>
      <MenuTrigger
        className={mc(
          "p-0.5 outline-none inline-flex rounded-lg",
          "text-slate-800 dark:text-slate-100",
          "data-[state=open]:bg-slate-200 dark:data-[state=open]:bg-slate-700 "
        )}
      >
        <CustomIcon
          icon={MoreHorizontal}
          label="Menu del chat"
          className="w-5 h-5"
        />
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem disabled>Archivar chat</MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            muteChat(chatId);
          }}
        >
          {isMuted ? "Activar notificaciones" : "Silenciar notificaciones"}
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
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            pinChat(chatId);
          }}
        >
          {isPinned ? "Desfijar chat" : "Fijar chat"}
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
