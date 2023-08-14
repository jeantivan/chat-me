import useStore from "@/lib/store";
import { ChatItem } from "./ChatItem";

export function ArchivedChats() {
  const chats = useStore((state) => state.chats);

  const archivedChats = chats.filter((c) => c.archived);

  return (
    <div className="p-2 overflow-y-auto flex-1 flex flex-col h-full">
      {archivedChats.map((chat) => (
        <ChatItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
}
