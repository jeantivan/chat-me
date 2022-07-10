import { BsSearch } from "react-icons/bs";
import { ChatItem } from "./ChatItem";
import { CustomIcon } from "./CustomIcon";

export function ChatList({
  chats,
  selectedChat,
  setSelectedChat,
  isError,
  isLoading,
}) {
  return (
    <div className="chats-list h-full dark:bg-slate-800/80 border-solid border-r border-slate-200 dark:border-slate-600 flex flex-col">
      <div className="dark:bg-slate-800 bg-white p-2 sticky top-0 border-b border-slate-200 dark:border-slate-600 border-solid">
        <div className="flex dark:text-gray-400 text-gray-500 dark:bg-slate-700 bg-zinc-100 rounded-md">
          <CustomIcon
            label="Buscar"
            Icon={BsSearch}
            className="w-fit p-2 pl-3"
          />
          <div className="w-full">
            <input
              className="w-full py-2 px-3 bg-transparent focus:outline-none"
              placeholder="Busca o inicia un nuevo chat"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col overflow-y-auto overflow-x-hidden">
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
          chats.map((chat) => (
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
