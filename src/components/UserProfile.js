import {
  BsPlusCircle,
  BsThreeDotsVertical,
  BsChatLeftTextFill,
} from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";

export function UserProfile({ user }) {
  return (
    <div className="user-profile dark:bg-slate-800 bg-zinc-50 border-solid border-r border-b border-slate-200 dark:border-slate-600 z-10  px-3 py-2 flex">
      <div className="flex items-center flex-1">
        <div className="text-gray-400 w-10 h-10 rounded-full mr-3">
          <FaUserCircle className="h-full w-full" />
        </div>
        <div className="text-lg font-bold dark:text-white">John Doe</div>
      </div>
      <div className="flex items-center">
        <div className="h-8 w-8 ml-2 rounded-full dark:text-gray-400 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600   p-1">
          <BsPlusCircle className="h-full w-full" />
        </div>
        <div className="h-8 w-8 ml-2 rounded-full dark:text-gray-400 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600 p-2">
          <BsChatLeftTextFill className="h-full w-full" />
        </div>
        <div className="h-8 w-8 ml-2 rounded-full dark:text-gray-400 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600 p-2">
          <BsThreeDotsVertical className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
