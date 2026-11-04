import { useMemo } from "react";
import orderBy from "lodash/orderBy";
import { useUserId } from "@/lib/hooks";
import { useChats } from "@/lib/api/chatQueries";
import { toUiChat, getDateOfLastMessage } from "@/lib/utils/chatAdapter";
import { useTranslation } from "@/lib/i18n";
import { ChatItem } from "./ChatItem";
import { ScrollArea } from "./ui/ScrollArea";

export function ArchivedChats() {
  const { t } = useTranslation();
  const currentUserId = useUserId();
  const { data: serverChats } = useChats();

  const archivedChats = useMemo(() => {
    if (!serverChats) return [];
    const uiChats = serverChats.map((sc) => toUiChat(sc, currentUserId));
    const archived = uiChats.filter((c) => c.archived);
    return orderBy(archived, [getDateOfLastMessage], ["desc"]);
  }, [serverChats, currentUserId]);

  return (
    <ScrollArea type="always" className="p-2" aria-label={t("menu.archivedChats")}>
      <div className="grid gap-1">
        {archivedChats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>
    </ScrollArea>
  );
}
