import { useUserId } from "@/lib/hooks";
import { usePresenceStore } from "@/lib/store/presenceStore";
import { useBlockedUsers } from "@/lib/api/settingsQueries";
import type { TChat } from "@/lib/types";

export function useChatDisplay(chat: TChat) {
  const currentUserId = useUserId();
  const isGroup = chat.type === "group";
  const { data: blockedUsers = [] } = useBlockedUsers();

  const typingByChat = usePresenceStore((state) => state.typingByChat);
  const presenceByUser = usePresenceStore((state) => state.presenceByUser);

  const isTyping = Boolean(typingByChat[chat.id]);

  if (isGroup) {
    const isAnyParticipantOnline = chat.participants.some((p) => {
      if (p.id === currentUserId) return false;
      return presenceByUser[p.id]?.status === "online";
    });

    return {
      counterpart: undefined,
      otherUserId: undefined,
      name: chat.title || "Group",
      picture: chat.pictureUrl || "",
      bio: chat.bio || `${chat.participants.length} participants`,
      participantCount: chat.participants.length,
      phone: "",
      isTyping,
      presence: undefined,
      isOnline: isAnyParticipantOnline,
      isGroup: true,
      isBlocked: false,
    };
  }

  const counterpart =
    chat.participants.find((p) => p.id !== currentUserId) ||
    chat.participants[0];

  const { name, picture, bio, phone } = counterpart || {
    name: "Chat",
    picture: "",
    bio: "",
    phone: "",
  };
  const otherUserId = counterpart?.id;

  const isBlocked = Boolean(
    otherUserId && blockedUsers.some((b) => b.id === otherUserId)
  );

  const presence = otherUserId ? presenceByUser[otherUserId] : undefined;
  const isOnline = !isBlocked && presence?.status === "online";

  return {
    counterpart,
    otherUserId,
    name,
    picture: isBlocked ? "" : picture,
    bio: isBlocked ? "" : bio,
    participantCount: chat.participants.length,
    phone,
    isTyping: !isBlocked && isTyping,
    presence: isBlocked ? undefined : presence,
    isOnline,
    isGroup: false,
    isBlocked,
  };
}

export const useChatCounterpart = useChatDisplay;

