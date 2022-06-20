import { FaUserCircle } from "react-icons/fa";
import { BsPinAngleFill } from "react-icons/bs";

export function ChatItem({ contactName, lastMessage, time }) {
  return (
    <div className="dark:bg-slate-800/80 dark:hover:bg-slate-700 bg-white hover:bg-slate-100 flex border-collapse border-b border-slate-200 dark:border-slate-600 border-solid">
      <div className="p-2 rounded-full w-16 h-16 overflow-hidden text-gray-400">
        <FaUserCircle className="w-full h-full" />
      </div>
      <div className="flex-1 py-2 px-3 flex flex-col">
        <div className="flex items-center">
          <p className="flex-1 text-lg dark:text-white mb-1">{contactName}</p>
          <span className="text-xs dark:text-gray-400 text-gray-500">
            {time}
          </span>
        </div>
        <div className="flex">
          <p className="text-sm dark:text-gray-400 text-gray-500 line-clamp-1 flex-1">
            {lastMessage}
          </p>
          <span className="text-sm dark:text-gray-400 text-gray-500">
            <BsPinAngleFill className="w-full h-full p-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
