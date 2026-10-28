import type { ChatSummary } from "@chat-me/shared";
import type { TChat, TMessage } from "@/lib/types";

export function toUiChat(summary: ChatSummary, currentUserId?: string): TChat {
  const isGroup = summary.type === "group";
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
          deleted: summary.lastMessage.deleted,
          hasMedia: summary.lastMessage.hasMedia,
          reactions: (summary.lastMessage.reactions || []) as any,
        },
      ]
    : [];

  const participants = isGroup
    ? summary.participants.map((p) => ({
        id: p.user?.id || p.userId,
        name: p.user?.name || "Participant",
        bio: p.user?.bio || "",
        phone: p.user?.phone || "",
        picture: p.user?.pictureUrl || "",
        role: p.role,
      }))
    : [
        {
          id: otherParticipant?.user?.id || "",
          name: otherParticipant?.user?.name || summary.title || "Chat",
          bio: otherParticipant?.user?.bio || "",
          phone: otherParticipant?.user?.phone || "",
          picture: otherParticipant?.user?.pictureUrl || "",
          role: otherParticipant?.role,
        },
      ];

  return {
    id: summary.id,
    type: summary.type,
    title: summary.title,
    bio: summary.bio || null,
    pictureUrl: summary.pictureUrl,
    participants,
    pinned: participantSummary?.pinned || false,
    muted: participantSummary?.muted || false,
    archived: participantSummary?.archived || false,
    hasUnreadMsg: summary.unreadCount || 0,
    messages: lastMsg,
  };
}
