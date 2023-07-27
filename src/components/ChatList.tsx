import orderBy from "lodash/orderBy";
import partition from "lodash/partition";
import { ChatItem } from "./ChatItem";
import { SearchChats } from "./SearchChats";
import useStore from "@/lib/store";
import { TChat } from "@/lib/types";

const getDateOfLastMessage = (c: TChat) => {
  const date = c.messages[c.messages.length - 1].time;

  return new Date(date);
};

export function ChatList() {
  const chats = useStore((state) => state.chats);

  const orderChats = orderBy(chats, [getDateOfLastMessage], ["desc"]);

  const noArchivedChats = orderChats.filter((chat) => !chat.archived);

  const [pinnedChats, restChats] = partition(noArchivedChats, { pinned: true });

  return (
    <>
      <SearchChats />
      <div className="chats-list h-full p-2 overflow-x-hidden overflow-y-auto bg-background-1">
        {pinnedChats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
        {restChats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>
    </>
  );
}
