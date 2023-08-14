import { Welcome, Chat } from "@/components";
import { useCurrentChatId } from "@/lib/hooks";

export function RightColumn() {
  const { currentChatId } = useCurrentChatId();

  return (
    <section className="flex-1 w-full flex">
      {currentChatId ? <Chat chatId={currentChatId} /> : <Welcome />}
    </section>
  );
}
