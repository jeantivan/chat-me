import { BsSearch } from "react-icons/bs";
import { ContactMenu } from "./ContactMenu";
import { useContactInfo } from "./ContactInfo";
import { useCurrentChat } from "./CurrentChat";
import useStore from "../store";

export function ChatHeader() {
  const { setOpenContactInfo } = useContactInfo();
  const chat = useStore((state) =>
    state.chats.find((chat) => chat.id === state.currentChatId)
  );

  if (!chat) return null;

  const { name, picture } = chat.contact;
  return (
    <header className="chat-header bg-slate-100 dark:bg-slate-700 shadow-lg">
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
              alt={`Foto de perfil de ${name}`}
            />
          </span>
          <span className="flex items-center">
            <span className="font-bold dark:text-white leading-none">
              {name}
            </span>
          </span>
        </button>
        <div className="flex items-center">
          <div className="h-9 w-9 ml-2 rounded-full dark:text-gray-400 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-600 p-2">
            <BsSearch className="h-full w-full" />
          </div>
          <div className="ml-2">
            <ContactMenu />
          </div>
        </div>
      </div>
    </header>
  );
}