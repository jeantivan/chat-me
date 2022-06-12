import { BsSearch } from "react-icons/bs";

import { CHATS } from "../utils/constants";
import { ChatItem } from "./ChatItem";

export function ChatList({ chats }) {
  return (
    <div className="chats-list dark:bg-slate-800/80 border-solid border-r border-slate-200 dark:border-slate-600 flex flex-col">
      <div className="dark:bg-slate-800 bg-white p-2 sticky top-0 border-b border-slate-200 dark:border-slate-600 border-solid">
        <div className="flex dark:text-gray-400 text-gray-500 dark:bg-slate-700 bg-zinc-100 rounded-md">
          <div className="w-fit p-2 pl-3">
            <BsSearch className="w-full h-full" />
          </div>
          <div className="w-full">
            <input
              className="w-full py-2 px-3 bg-transparent focus:outline-none"
              placeholder="Busca o inicia un nuevo chat"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col overflow-y-auto">
        {CHATS.map((chat) => (
          <ChatItem key={chat.id} {...chat} />
        ))}
      </div>
    </div>
  );
}
