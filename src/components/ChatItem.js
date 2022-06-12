import { FaUserCircle } from "react-icons/fa";

export function ChatItem({ contactName, lastMessage, time }) {
  return (
    <div className="dark:bg-slate-700/80 dark:hover:bg-slate-700 flex border-collapse border-y border-slate-700 border-solid">
      <div className="p-2 rounded-full w-16 h-16 overflow-hidden text-gray-400">
        <FaUserCircle className="w-full h-full" />
      </div>
      <div className="flex-1 py-2 px-3 flex flex-col">
        <div className="flex">
          <p className="flex-1 text-lg dark:text-white mb-1 font-medium">
            {contactName}
          </p>
          <span className="text-sm dark:text-gray-400">{time}</span>
        </div>
        <p className="text-sm dark:text-gray-400 line-clamp-1">{lastMessage}</p>
      </div>
    </div>
  );
}
