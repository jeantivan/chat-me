import { useMemo } from "react";
import orderBy from "lodash/orderBy";
import partition from "lodash/partition";
import { Archive } from "lucide-react";
import { ChatItem } from "./ChatItem";
import { SearchChats } from "./SearchChats";
import { ScrollArea } from "./ui/ScrollArea";
import useStore from "@/lib/store";
import { useUserId } from "@/lib/hooks";
import { useChats } from "@/lib/api/chatQueries";
import { toUiChat, getDateOfLastMessage } from "@/lib/utils/chatAdapter";
import { TChat } from "@/lib/types";

export function ChatList() {
  const currentUserId = useUserId();
  const { data: serverChats } = useChats();
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);

  const uiChats: TChat[] = useMemo(() => {
    if (!serverChats) return [];
    return serverChats.map((sc) => toUiChat(sc, currentUserId));
  }, [serverChats, currentUserId]);

  const orderChats = useMemo(
    () => orderBy(uiChats, [getDateOfLastMessage], ["desc"]),
    [uiChats]
  );

  const [archivedChats, nonArchivedChats] = useMemo(
    () => partition(orderChats, { archived: true }),
    [orderChats]
  );

  const [pinnedChats, restChats] = useMemo(
    () => partition(nonArchivedChats, { pinned: true }),
    [nonArchivedChats]
  );

  const totalArchivedUnread = useMemo(
    () =>
      archivedChats.reduce(
        (sum, c) =>
          sum + (typeof c.hasUnreadMsg === "number" ? c.hasUnreadMsg : 0),
        0
      ),
    [archivedChats]
  );

  return (
    <>
      <SearchChats />
      <ScrollArea type="auto" className="chats-list p-2 bg-background-1">
        <div className="grid gap-1">
          {archivedChats.length > 0 && (
            <button
              data-testid="archived-banner-button"
              aria-label="Archived"
              onClick={() => leftDrawerGoTo("ARCHIVED_CHATS")}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-background-4 text-background-12 transition-colors mb-1 cursor-pointer select-none"
            >
              <div className="flex items-center gap-4">
                <Archive className="w-5 h-5 text-primary-9" />
                <span className="font-medium text-base">Archived</span>
              </div>
              {totalArchivedUnread > 0 && (
                <span
                  data-testid="archived-unread-count"
                  className="text-xs font-bold text-primary-9"
                >
                  {totalArchivedUnread}
                </span>
              )}
            </button>
          )}
          {pinnedChats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
          {restChats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      </ScrollArea>
    </>
  );
}
