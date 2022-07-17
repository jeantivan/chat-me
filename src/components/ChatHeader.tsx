import { BsSearch } from "react-icons/bs";
import { ContactMenu } from "./ContactMenu";
import { useContactInfo } from "./ContactInfo";
import { Contact } from "../types";
import { Dispatch, SetStateAction } from "react";

interface ChatHeaderProps {
  selectedChat: Contact;
  setSelectedChat: Dispatch<SetStateAction<Contact | null>>;
}

export function ChatHeader(props: ChatHeaderProps) {
  const { setOpenContactInfo } = useContactInfo();
  const { name, picture } = props.selectedChat;
  return (
    <header className="chat-header dark:bg-slate-800 bg-zinc-50 border-solid border-b border-slate-200 dark:border-slate-600">
      <div className="flex items-center px-5 py-2">
        <button
          onClick={() => {
            setOpenContactInfo(true);
          }}
          className="flex-1 flex items-stretch"
        >
          <span className="text-gray-400 w-10 h-10 rounded-full mr-3">
            <img
              className="bg-gray-400 w-full h-full rounded-full"
              src={picture.thumbnail}
              alt={`Foto de perfil de ${name.fullName}`}
            />
          </span>
          <span className="flex items-center">
            <span className="font-bold dark:text-white leading-none">
              {name.fullName}
            </span>
          </span>
        </button>
        <div className="flex items-center">
          <div className="h-9 w-9 ml-2 rounded-full dark:text-gray-400 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600 p-2">
            <BsSearch className="h-full w-full" />
          </div>
          <div className="ml-2">
            <ContactMenu {...props} />
          </div>
        </div>
      </div>
    </header>
  );
}
