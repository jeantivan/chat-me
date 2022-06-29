import { FaUserCircle } from "react-icons/fa";
import { BsSearch } from "react-icons/bs";
import { ContactMenu } from "./ContactMenu";

export function ChatHeader({ selectedChat, setSelectedChat }) {
  return (
    <div className="contact-info dark:bg-slate-800 bg-zinc-50 border-solid border-b border-slate-200 dark:border-slate-600">
      <div className="flex items-center px-5 py-2">
        <div className="flex-1 flex items-center">
          <div className="text-gray-400 w-10 h-10 rounded-full mr-3">
            <FaUserCircle className="h-full w-full" />
          </div>
          <div>
            <p className="font-bold dark:text-white leading-none">
              {selectedChat.contactName}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="h-9 w-9 ml-2 rounded-full dark:text-gray-400 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600 p-2">
            <BsSearch className="h-full w-full" />
          </div>
          <div className="ml-2">
            <ContactMenu
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
