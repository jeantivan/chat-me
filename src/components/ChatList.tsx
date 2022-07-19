import { ContactType, SelectedChatState } from "../types";
import { ChatItem } from "./ChatItem";

interface ChatListProps extends SelectedChatState {
  chats?: ContactType[];
  isError: boolean;
  isLoading: boolean;
}

export function ChatList({
  chats,
  selectedChat,
  setSelectedChat,
  isError,
  isLoading,
}: ChatListProps) {
  return (
    <div className="chats-list h-full overflow-x-hidden dark:bg-slate-800/80 border-solid border-r border-slate-200 dark:border-slate-600 flex flex-col">
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
            <ChatItem
              key={chat.phone}
              contact={chat}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
            />
          ))}
      </div>
    </div>
  );
}
