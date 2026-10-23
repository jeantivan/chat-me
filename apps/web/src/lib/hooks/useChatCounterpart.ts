import { useUserId } from "@/lib/hooks";
import { usePresenceStore } from "@/lib/store/presenceStore";
import type { TChat } from "@/lib/types";

export function useChatCounterpart(chat: TChat) {
  const currentUserId = useUserId();
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

  const isTyping = usePresenceStore((state) => state.typingByChat[chat.id]);
  const presence = usePresenceStore((state) =>
    otherUserId ? state.presenceByUser[otherUserId] : undefined
  );
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
  };
}
