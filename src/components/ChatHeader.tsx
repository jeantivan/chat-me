import { Search } from "lucide-react";

import { IconButton } from "./ui/IconButton";
import { ChatHeaderMenu } from "./ChatHeaderMenu";
import { TChat } from "@/lib/types";
import useStore from "@/lib/store";

export function ChatHeader({ chat }: { chat: TChat }) {
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const { name, picture } = chat.participants[0];

  return (
    <header className="chat-header bg-background-2 shadow-lg">
      <div className="flex items-center px-5 py-2">
        <button
          className="flex-1 flex items-stretch"
          onClick={() => {
            rightDrawerGoTo("CONTACT_INFO");
          }}
        >
          <span className="text-gray-400 w-10 h-10 rounded-full mr-3">
            <img
              className="bg-gray-400 w-full h-full rounded-full"
              src={picture}
              alt={`Foto de perfil de ${name}`}
            />
          </span>
          <span className="flex items-center">
            <span className="font-bold dark:text-white leading-none">
              {name}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <IconButton icon={Search} label="Buscar" />
          <ChatHeaderMenu />
        </div>
      </div>
    </header>
  );
}
