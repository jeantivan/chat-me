import { useState } from "react";
import { Trigger as MenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { MenuRoot, MenuContent, MenuItem } from "./ui/Menu";
import { Icon } from "./ui/Icon";
import mc from "@/lib/utils/mergeClassnames";
import { useUpdateChatParticipant } from "@/lib/api/chatQueries";
import { DeleteChatDialog } from "./Chat/DeleteChatDialog";
import { useTranslation } from "@/lib/i18n";

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
}: ChatItemMenuProps) {
  const { t } = useTranslation();
  const updateParticipant = useUpdateChatParticipant();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <MenuRoot>
        <MenuTrigger
          onClick={(e) => e.stopPropagation()}
          className={mc(
            "p-0.5 outline-none inline-flex rounded-lg",
            "text-background-12 hover:bg-background-5 data-[state=open]:bg-background-6"
          )}
        >
          <Icon icon={MoreHorizontal} label={t("chat.chatMenu")} className="w-5 h-5" />
        </MenuTrigger>
        <MenuContent align="start">
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              updateParticipant.mutate({ chatId, archived: !isArchived });
            }}
          >
            {isArchived ? t("chat.unarchiveChat") : t("chat.archiveChat")}
          </MenuItem>
          {!isArchived && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                updateParticipant.mutate({ chatId, muted: !isMuted });
              }}
            >
              {isMuted ? t("chat.unmuteNotifications") : t("chat.muteNotifications")}
            </MenuItem>
          )}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              updateParticipant.mutate({ chatId, markedUnread: !isUnread });
            }}
          >
            {isUnread ? t("chat.markAsRead") : t("chat.markAsUnread")}
          </MenuItem>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteOpen(true);
            }}
          >
            {t("chat.deleteChat")}
          </MenuItem>
          {!isArchived && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                updateParticipant.mutate({ chatId, pinned: !isPinned });
              }}
            >
              {isPinned ? t("chat.unpinChat") : t("chat.pinChat")}
            </MenuItem>
          )}
        </MenuContent>
      </MenuRoot>
      <DeleteChatDialog
        chatId={chatId}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
