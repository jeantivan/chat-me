import type { ChatSummary } from "@chat-me/shared";
import type { TChat, TMessage } from "@/lib/types";

export function toUiChat(summary: ChatSummary, currentUserId?: string): TChat {
  const otherParticipant =
    summary.participants.find((p) => p.userId !== currentUserId) ||
    summary.participants[0];
  const participantSummary = summary.participants.find(
    (p) => p.userId === currentUserId
  );

  const lastMsg: TMessage[] = summary.lastMessage
    ? [
        {
          id: summary.lastMessage.id,
          chatId: summary.id,
          owner: summary.lastMessage.owner,
          body: summary.lastMessage.body,
          forwarded: summary.lastMessage.forwarded,
          time: summary.lastMessage.time,
          status: summary.lastMessage.status,
          starred: summary.lastMessage.starred,
          hasMedia: summary.lastMessage.hasMedia,
          reactions: (summary.lastMessage.reactions || []) as any,
        },
      ]
    : [];

  return {
    id: summary.id,
    participants: [
      {
        id: otherParticipant?.user?.id || "",
        name: otherParticipant?.user?.name || summary.title || "Chat",
        bio: otherParticipant?.user?.bio || "",
        phone: otherParticipant?.user?.phone || "",
        picture: otherParticipant?.user?.pictureUrl || "",
      },
    ],
    pinned: participantSummary?.pinned || false,
    muted: participantSummary?.muted || false,
    archived: participantSummary?.archived || false,
    hasUnreadMsg: summary.unreadCount || 0,
    messages: lastMsg,
  };
}
