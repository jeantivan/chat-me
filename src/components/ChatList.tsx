import { ChatType } from "../types";
import { ChatItem } from "./ChatItem";

interface ChatListProps {
  chats?: ChatType[];
  isError: boolean;
  isLoading: boolean;
}

export function ChatList({ chats, isError, isLoading }: ChatListProps) {
  return (
    <div className="chats-list h-full overflow-x-hidden bg-white dark:bg-slate-800/80 border-solid border-r border-slate-200 dark:border-slate-600 flex flex-col">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {isError && (
          <div className="py-4 mx-auto text-lg dark:text-white">
            Ups algo salió mal
          </div>
        )}
        {isLoading && (
          <div className="py-4 mx-auto text-lg dark:text-white">
            Cargando...
          </div>
        )}
        {!isError &&
          !isLoading &&
          chats?.map((chat) => (
            <ChatItem key={chat.contact.phone} chat={chat} />
          ))}
      </div>
    </div>
  );
}
