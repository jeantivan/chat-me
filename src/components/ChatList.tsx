import useStore from "../store";
import { ChatType } from "../types";
import { ChatItem } from "./ChatItem";

interface ChatListProps {
  chats?: ChatType[];
  isError: boolean;
  isLoading: boolean;
}

export function ChatList() {
  const chats = useStore((state) => state.chats);

  return (
    <div className="chats-list h-full overflow-x-hidden bg-white dark:bg-slate-800/80 border-solid border-r border-slate-200 dark:border-slate-600 flex flex-col">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {chats.map((chat) => (
          <ChatItem key={chat.id} id={chat.id} />
        ))}
      </div>
    </div>
  );
}
