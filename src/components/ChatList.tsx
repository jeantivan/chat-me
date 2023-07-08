import { orderBy, sortBy } from "lodash";
import { ChatItem } from "./ChatItem";
import useStore from "@/lib/store";
import { ChatType } from "@/lib/types";

interface ChatListProps {
  chats?: ChatType[];
  isError: boolean;
  isLoading: boolean;
}

export function ChatList() {
  const chats = useStore((state) => state.chats);

  const orderedChat = orderBy(chats, ["isPinned"], ["desc"]);

  return (
    <div className="chats-list h-full overflow-x-hidden bg-white dark:bg-slate-800/80 border-solid border-r border-slate-200 dark:border-slate-600 flex flex-col">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {orderedChat.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>
    </div>
  );
}
