import { useMemo } from "react";
import orderBy from "lodash/orderBy";
import partition from "lodash/partition";
import { ChatItem } from "./ChatItem";
import { SearchChats } from "./SearchChats";
import { ScrollArea } from "./ui/ScrollArea";
import useStore from "@/lib/store";
import { TChat } from "@/lib/types";

const getDateOfLastMessage = (c: TChat) => {
  const date = c.messages[c.messages.length - 1].time;

  return new Date(date);
};

export function ChatList() {
  const chats = useStore((state) => state.chats);

  const noEmptyChats = chats.filter((chat) => chat.messages.length > 0);

  const orderChats = orderBy(noEmptyChats, [getDateOfLastMessage], ["desc"]);

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
