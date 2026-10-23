import { useMemo } from "react";
import orderBy from "lodash/orderBy";
import partition from "lodash/partition";
import { ChatItem } from "./ChatItem";
import { SearchChats } from "./SearchChats";
import { ScrollArea } from "./ui/ScrollArea";
import useStore from "@/lib/store";
import { useUserId } from "@/lib/hooks";
import { useChats } from "@/lib/api/chatQueries";
import { TChat, TMessage } from "@/lib/types";

const getDateOfLastMessage = (c: TChat) => {
  if (!c.messages.length) return new Date(0);
  const date = c.messages[c.messages.length - 1].time;
  return new Date(date);
};

export function ChatList() {
  const currentUserId = useUserId();
  const { data: serverChats } = useChats();
  const storeChats = useStore((state) => state.chats);

  const mergedChats: TChat[] = useMemo(() => {
    if (serverChats && serverChats.length > 0) {
      return serverChats.map((sc) => {
        const otherParticipant =
          sc.participants.find((p) => p.userId !== currentUserId) ||
          sc.participants[0];
        const participantSummary = sc.participants.find(
          (p) => p.userId === currentUserId
        );

        const lastMsg: TMessage[] = sc.lastMessage
          ? [
              {
                id: sc.lastMessage.id,
                chatId: sc.id,
                owner: sc.lastMessage.owner,
                body: sc.lastMessage.body,
                forwarded: sc.lastMessage.forwarded,
                time: sc.lastMessage.time,
                status: sc.lastMessage.status,
                starred: sc.lastMessage.starred,
                hasMedia: sc.lastMessage.hasMedia,
                reactions: (sc.lastMessage.reactions || []) as any,
              },
            ]
          : [];

        return {
          id: sc.id,
          participants: [
            {
              id: otherParticipant?.user.id || "",
              name: otherParticipant?.user.name || sc.title || "Chat",
              bio: otherParticipant?.user.bio || "",
              phone: otherParticipant?.user.phone || "",
              picture: otherParticipant?.user.pictureUrl || "",
            },
          ],
          pinned: participantSummary?.pinned || false,
          muted: participantSummary?.muted || false,
          archived: participantSummary?.archived || false,
          hasUnreadMsg: sc.unreadCount || 0,
          messages: lastMsg,
        };
      });
    }
    return storeChats;
  }, [serverChats, currentUserId, storeChats]);

  const noEmptyChats = mergedChats.filter((chat) => chat.messages.length > 0);

  const orderChats = orderBy(noEmptyChats, [getDateOfLastMessage], ["desc"]);

  const noArchivedChats = orderChats.filter((chat) => !chat.archived);

  const [pinnedChats, restChats] = partition(noArchivedChats, { pinned: true });

  return (
    <>
      <SearchChats />
      <ScrollArea type="auto" className="chats-list p-2 bg-background-1">
        <div className="grid gap-1">
          {pinnedChats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
          {restChats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      </ScrollArea>
    </>
  );
}
