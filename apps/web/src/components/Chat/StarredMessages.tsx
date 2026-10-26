import { ArrowLeft, Star } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Message } from "@/components/Message";
import useStore from "@/lib/store";
import { useCurrentChatId, useUserId } from "@/lib/hooks";
import { useStarredMessages } from "@/lib/api/chatQueries";
import type { TMessage } from "@/lib/types";

export function StarredMessages({ isLeftDrawer = false }: { isLeftDrawer?: boolean } = {}) {
  const rdGoBack = useStore((state) => state.rdGoBack);
  const userId = useUserId();
  const { currentChatId } = useCurrentChatId();

  const targetChatId = isLeftDrawer ? null : currentChatId;
  const { data: starredData = [] } = useStarredMessages(targetChatId);

  const starredMessages: TMessage[] = starredData.map((m) => ({
    id: m.id,
    chatId: m.chatId,
    owner: m.owner,
    body: m.body,
    forwarded: m.forwarded,
    time: m.time,
    status: m.status,
    starred: m.starred,
    deleted: m.deleted,
    hasMedia: m.hasMedia,
    reactions: (m.reactions || []) as any,
  }));

  return (
    <div className="bg-background-5 flex flex-col h-full">
      {!isLeftDrawer && (
        <header className="min-h-[56px] py-2 px-4 flex items-center sticky gap-4 bg-background-2">
          <IconButton icon={ArrowLeft} label="Volver atrás" onClick={rdGoBack} />
          <h2
            id="right-drawer-title "
            className="text-lg line-clamp-1 truncate text-background-12"
          >
            Mensajes destacados
          </h2>
        </header>
      )}
      <ScrollArea type="auto" className="pr-2.5 flex-1">
        <div className="p-3 grid gap-2">
          {starredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-background-11 gap-2">
              <Star className="w-8 h-8 opacity-40" />
              <p className="text-sm">No hay mensajes destacados</p>
            </div>
          ) : (
            starredMessages.map((msg) => (
              <div key={msg.id} data-testid={`starred-message-${msg.id}`}>
                <Message
                  isOwnMsg={msg.owner === userId}
                  hasTail={true}
                  message={msg}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
