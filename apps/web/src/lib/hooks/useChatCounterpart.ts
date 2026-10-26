import { useUserId } from "@/lib/hooks";
import { usePresenceStore } from "@/lib/store/presenceStore";
import type { TChat } from "@/lib/types";

export function useChatCounterpart(chat: TChat) {
  const currentUserId = useUserId();
  const isGroup = chat.type === "group";

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
      bio: `${chat.participants.length} participants`,
      phone: "",
      isTyping,
      presence: undefined,
      isOnline: isAnyParticipantOnline,
      isGroup: true,
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

  const presence = otherUserId ? presenceByUser[otherUserId] : undefined;
  const isOnline = presence?.status === "online";

  return {
    counterpart,
    otherUserId,
    name,
    picture,
    bio,
    phone,
    isTyping,
    presence,
    isOnline,
    isGroup: false,
  };
}
