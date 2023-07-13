import { Chat } from "./Chat";
import { Welcome } from "@/components";
import useStore from "@/lib/store";
export function RightColumn() {
  const currentChatId = useStore((state) => state.currentChatId);

  return (
    <section className="flex-1 w-full flex">
      {currentChatId ? <Chat chatId={currentChatId} /> : <Welcome />}
    </section>
  );
}
