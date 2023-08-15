import useStore from "@/lib/store";
import { ChatItem } from "./ChatItem";
import { ScrollArea } from "./ui/ScrollArea";

export function ArchivedChats() {
  const chats = useStore((state) => state.chats);

  const archivedChats = chats.filter((c) => c.archived);

  return (
    <ScrollArea type="always" className="p-2">
      <div className="grid gap-1">
        {archivedChats.map((chat) => (
          <ChatItem key={chat.id} chat={chat} />
        ))}
      </div>
    </ScrollArea>
  );
}
