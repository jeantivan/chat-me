import { orderBy } from "lodash";
import { ChatItem } from "./ChatItem";
import useStore from "@/lib/store";
import { SearchChats } from "./SearchChats";

export function ChatList() {
  const chats = useStore((state) => state.chats);

  const orderedChat = orderBy(chats, ["isPinned"], ["desc"]);

  return (
    <>
      <SearchChats />
      <div className="chats-list h-full p-2 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-800/80 border-solid border-r border-slate-200 dark:border-slate-600">
        {orderedChat.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>
    </>
  );
}
