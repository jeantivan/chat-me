import { useMemo } from "react";
import orderBy from "lodash/orderBy";
import partition from "lodash/partition";
import { ChatItem } from "./ChatItem";
import { SearchChats } from "./SearchChats";
import { ScrollArea } from "./ui/ScrollArea";
import useStore from "@/lib/store";
import { useUserId } from "@/lib/hooks";
import { useChats } from "@/lib/api/chatQueries";
import { toUiChat } from "@/lib/utils/chatAdapter";
import { TChat } from "@/lib/types";

const getDateOfLastMessage = (c: TChat) => {
  if (!c.messages.length) return new Date(0);
  const date = c.messages[c.messages.length - 1].time;
  return new Date(date);
};

export function ChatList() {
  const currentUserId = useUserId();
  const { data: serverChats } = useChats();
  const storeChats = useStore((state) => state.chats);

  const mergedChats: TChat[] = useMemo(() => {
    if (serverChats && serverChats.length > 0) {
      return serverChats.map((sc) => toUiChat(sc, currentUserId));
    }
    return storeChats;
  }, [serverChats, currentUserId, storeChats]);

  const displayChats = serverChats ? mergedChats : mergedChats.filter((chat) => chat.messages.length > 0);

  const orderChats = orderBy(displayChats, [getDateOfLastMessage], ["desc"]);

  const noArchivedChats = orderChats.filter((chat) => !chat.archived);

  const [pinnedChats, restChats] = partition(noArchivedChats, { pinned: true });

  return (
    <>
      <SearchChats />
      <ScrollArea type="auto" className="chats-list p-2 bg-background-1">
        <div className="grid gap-1">
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
