import { useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { getSocket } from "./socketClient";
import { usePresenceStore } from "../store/presenceStore";
import useStore from "../store";
import { router } from "@/routes/router";
import {
  handleInboundMessageNotification,
  handleInboundReactionNotification,
} from "../notifications/notificationEngine";
import {
  DELETED_MESSAGE_TOMBSTONE,
  type MessagePayload,
  type MessagesPageResponse,
  type ChatSummary,
  type ReceiptStatusPayload,
  type DeliveryStatus,
  type UserPresence,
  type UserProfile,
  type ContactSummary,
  type ChatParticipantUpdatedPayload,
  type ChatClearedPayload,
} from "@chat-me/shared";

export function patchMessageInPages(
  oldData: InfiniteData<MessagesPageResponse> | undefined,
  messageId: string,
  updater: (msg: MessagePayload) => MessagePayload
): InfiniteData<MessagesPageResponse> | undefined {
  if (!oldData) return oldData;
  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === messageId ? updater(m) : m)),
    })),
  };
}

export function patchMessageStatusInPages(
  oldData: InfiniteData<MessagesPageResponse> | undefined,
  messageId: string,
  status: DeliveryStatus
): InfiniteData<MessagesPageResponse> | undefined {
  return patchMessageInPages(oldData, messageId, (m) => ({ ...m, status }));
}

export function getChatParticipant(
  queryClient: { getQueryData: <T>(key: readonly unknown[]) => T | undefined },
  chatId: string,
  userId?: string
) {
  if (!userId) return undefined;
  const chatList = queryClient.getQueryData<ChatSummary[]>(chatKeys.lists());
  const currentChat = chatList?.find((c) => c.id === chatId);
  return currentChat?.participants.find((p) => p.userId === userId);
}

export function isChatParticipantMuted(
  queryClient: { getQueryData: <T>(key: readonly unknown[]) => T | undefined },
  chatId: string,
  userId?: string
): boolean {
  return getChatParticipant(queryClient, chatId, userId)?.muted ?? false;
}

export function isChatParticipantArchived(
  queryClient: { getQueryData: <T>(key: readonly unknown[]) => T | undefined },
  chatId: string,
  userId?: string
): boolean {
  return getChatParticipant(queryClient, chatId, userId)?.archived ?? false;
}

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  detail: (chatId: string) => [...chatKeys.all, "detail", chatId] as const,
  messages: (chatId: string) => [...chatKeys.all, "messages", chatId] as const,
  starred: (chatId?: string | null) =>
    [...chatKeys.all, "starred", chatId || "all"] as const,
  media: (chatId: string, type?: string) =>
    [...chatKeys.all, "media", chatId, type || "all"] as const,
  contacts: ["contacts"] as const,
  user: ["user", "me"] as const,
  settings: ["user", "settings"] as const,
  blocked: ["user", "blocked"] as const,
};

export function useSocketSync(
  currentChatId?: string | null,
  currentUserId?: string
) {
  const queryClient = useQueryClient();

  // Reset unreadCount and markedUnread in chat list cache immediately upon viewing active chat
  useEffect(() => {
    if (!currentChatId) return;
    queryClient.setQueryData<ChatSummary[]>(chatKeys.lists(), (oldChats) => {
      if (!oldChats) return oldChats;
      return oldChats.map((c) =>
        c.id === currentChatId
          ? {
              ...c,
              unreadCount: 0,
              participants: c.participants.map((p) =>
                p.userId === currentUserId ? { ...p, markedUnread: false } : p
              ),
            }
          : c
      );
    });
  }, [currentChatId, currentUserId, queryClient]);

  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (newMsg: MessagePayload) => {
      // 1. Update message list cache
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(newMsg.chatId),
        (oldData) => {
          if (!oldData || !oldData.pages.length) {
            return oldData;
          }
          // Avoid duplicate insertion
          const exists = oldData.pages.some((page) =>
            page.messages.some((m) => m.id === newMsg.id)
          );
          if (exists) return oldData;

          // Append to the first/latest page
          return {
            ...oldData,
            pages: oldData.pages.map((page, idx) =>
              idx === 0
                ? { ...page, messages: [...page.messages, newMsg] }
                : page
            ),
          };
        }
      );

      // 2. Update chat list cache
      queryClient.setQueryData<ChatSummary[]>(
        chatKeys.lists(),
        (oldChats) => {
          if (!oldChats) return oldChats;
          const target = oldChats.find((c) => c.id === newMsg.chatId);
          if (!target) {
            queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
            return oldChats;
          }
          const isViewing = currentChatId === newMsg.chatId;
          const updated: ChatSummary = {
            ...target,
            lastMessage: newMsg,
            unreadCount: isViewing ? 0 : (target.unreadCount || 0) + 1,
            updatedAt: newMsg.time,
          };
          return [updated, ...oldChats.filter((c) => c.id !== newMsg.chatId)];
        }
      );

      // 3. Emit delivery and read receipts if received from another user
      if (currentUserId && newMsg.owner !== currentUserId) {
        socket.emit("message:ack_received", {
          chatId: newMsg.chatId,
          messageIds: [newMsg.id],
        });

        if (
          currentChatId === newMsg.chatId &&
          typeof document !== "undefined" &&
          document.visibilityState === "visible"
        ) {
          socket.emit("message:ack_read", {
            chatId: newMsg.chatId,
            lastMessageId: newMsg.id,
          });
        }
      }

      // 4. Trigger client notification engine
      const participant = getChatParticipant(queryClient, newMsg.chatId, currentUserId);
      const isMuted = participant?.muted ?? false;
      const isArchived = participant?.archived ?? false;
      const settings = useStore.getState().notifications;

      if (newMsg.hasMedia) {
        queryClient.invalidateQueries({ queryKey: [...chatKeys.all, "media"] });
      }

      handleInboundMessageNotification({
        message: newMsg,
        currentUserId,
        currentChatId,
        isChatMuted: isMuted,
        isChatArchived: isArchived,
        settings: {
          notifyAll: settings.all,
          notifySound: settings.sound,
          notifyPreview: settings.preview,
        },
      });
    };

    const handleStatusChanged = ({
      messageId,
      chatId,
      status,
    }: ReceiptStatusPayload) => {
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) => patchMessageStatusInPages(oldData, messageId, status)
      );
    };

    const handleReactionUpdated = ({
      messageId,
      chatId,
      reactions,
    }: {
      messageId: string;
      chatId: string;
      reactions: Array<{ owner: string; type: string }>;
    }) => {
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) =>
          patchMessageInPages(oldData, messageId, (m) => ({ ...m, reactions }))
      );

      queryClient.setQueryData<MessagePayload[]>(
        chatKeys.starred(chatId),
        (oldStarred) =>
          oldStarred
            ? oldStarred.map((m) =>
                m.id === messageId ? { ...m, reactions } : m
              )
            : oldStarred
      );

      queryClient.setQueryData<MessagePayload[]>(
        chatKeys.starred(),
        (oldStarred) =>
          oldStarred
            ? oldStarred.map((m) =>
                m.id === messageId ? { ...m, reactions } : m
              )
            : oldStarred
      );

      // Trigger client notification engine for reaction
      const messagesData = queryClient.getQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId)
      );
      let targetMessage: MessagePayload | undefined;
      if (messagesData) {
        for (const page of messagesData.pages) {
          const found = page.messages.find((m) => m.id === messageId);
          if (found) {
            targetMessage = found;
            break;
          }
        }
      }

      const isMuted = isChatParticipantMuted(queryClient, chatId, currentUserId);
      const isArchived = isChatParticipantArchived(queryClient, chatId, currentUserId);
      const settings = useStore.getState().notifications;

      handleInboundReactionNotification({
        chatId,
        messageId,
        reactions,
        targetMessageOwnerId: targetMessage?.owner,
        targetMessageBody: targetMessage?.body,
        currentUserId,
        currentChatId,
        isChatMuted: isMuted,
        isChatArchived: isArchived,
        settings: {
          notifyAll: settings.all,
          notifySound: settings.sound,
          notifyPreview: settings.preview,
          notifyReactions: settings.reactions,
        },
      });
    };

    const handleMessageDeleted = ({
      messageId,
      chatId,
    }: {
      messageId: string;
      chatId: string;
    }) => {
      const toTombstone = (m: MessagePayload): MessagePayload => ({
        ...m,
        body: DELETED_MESSAGE_TOMBSTONE,
        deleted: true,
        hasMedia: null,
        reactions: [],
        starred: false,
        forwarded: false,
      });

      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) => patchMessageInPages(oldData, messageId, toTombstone)
      );

      queryClient.setQueryData<ChatSummary[]>(
        chatKeys.lists(),
        (oldChats) => {
          if (!oldChats) return oldChats;
          return oldChats.map((c) =>
            c.id === chatId && c.lastMessage?.id === messageId
              ? {
                  ...c,
                  lastMessage: toTombstone(c.lastMessage),
                }
              : c
          );
        }
      );

      queryClient.setQueryData<MessagePayload[]>(
        chatKeys.starred(chatId),
        (oldStarred) =>
          oldStarred
            ? oldStarred.map((m) => (m.id === messageId ? toTombstone(m) : m))
            : oldStarred
      );

      queryClient.setQueryData<MessagePayload[]>(
        chatKeys.starred(),
        (oldStarred) =>
          oldStarred
            ? oldStarred.map((m) => (m.id === messageId ? toTombstone(m) : m))
            : oldStarred
      );

      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, "media"] });
    };

    const handleTypingUpdated = ({
      chatId,
      userId,
      isTyping,
    }: {
      chatId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (userId !== currentUserId) {
        usePresenceStore.getState().setTyping(chatId, isTyping);
      }
    };

    const handlePresenceUpdated = ({
      userId,
      status,
      lastSeenAt,
    }: UserPresence) => {
      usePresenceStore.getState().setPresence(userId, { status, lastSeenAt: lastSeenAt || undefined });
    };

    const handleProfileUpdated = (updatedUser: UserProfile) => {
      // 1. If self update, update user query cache and Zustand profile store
      if (currentUserId && updatedUser.id === currentUserId) {
        queryClient.setQueryData<UserProfile>(chatKeys.user, updatedUser);
        useStore.getState().changeName(updatedUser.name);
        useStore.getState().changeBio(updatedUser.bio);
        useStore.getState().changePicture(updatedUser.pictureUrl);
      }

      // 2. Update contacts cache
      queryClient.setQueryData<ContactSummary[]>(chatKeys.contacts, (oldContacts) => {
        if (!oldContacts) return oldContacts;
        return oldContacts.map((c) =>
          c.contactUserId === updatedUser.id
            ? { ...c, contact: updatedUser }
            : c
        );
      });

      // 3. Update chats list cache
      queryClient.setQueryData<ChatSummary[]>(chatKeys.lists(), (oldChats) => {
        if (!oldChats) return oldChats;
        return oldChats.map((chat) => {
          const hasParticipant = chat.participants.some(
            (p) => p.userId === updatedUser.id
          );
          if (!hasParticipant) return chat;
          return {
            ...chat,
            participants: chat.participants.map((p) =>
              p.userId === updatedUser.id ? { ...p, user: updatedUser } : p
            ),
          };
        });
      });
    };

    const handleParticipantUpdated = (payload: ChatParticipantUpdatedPayload) => {
      queryClient.setQueryData<ChatSummary[]>(chatKeys.lists(), (oldChats) => {
        if (!oldChats) return oldChats;
        return oldChats.map((c) => {
          if (c.id !== payload.chatId) return c;
          const updatedParticipants = c.participants.map((p) => {
            if (p.userId !== payload.userId) return p;
            return {
              ...p,
              pinned: payload.pinned,
              muted: payload.muted,
              archived: payload.archived,
              markedUnread: payload.markedUnread,
              lastReadAt: payload.lastReadAt,
            };
          });

          let newUnreadCount = c.unreadCount;
          if (payload.userId === currentUserId) {
            if (payload.markedUnread) {
              newUnreadCount = (c.unreadCount && c.unreadCount > 0) ? c.unreadCount : 1;
            } else if (!payload.markedUnread && payload.lastReadAt) {
              newUnreadCount = 0;
            }
          }

          return {
            ...c,
            participants: updatedParticipants,
            unreadCount: newUnreadCount,
          };
        });
      });
    };

    const handleChatCleared = (payload: ChatClearedPayload) => {
      if (payload.userId !== currentUserId) return;

      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(payload.chatId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            pages: [{ messages: [], nextCursor: null, hasMore: false }],
            pageParams: [null],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(payload.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.starred(payload.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.starred() });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, "media"] });

      queryClient.setQueryData<ChatSummary[]>(chatKeys.lists(), (oldChats) => {
        if (!oldChats) return oldChats;
        if (payload.hiddenAt) {
          return oldChats.filter((c) => c.id !== payload.chatId);
        }
        return oldChats.map((c) =>
          c.id === payload.chatId
            ? {
                ...c,
                lastMessage: null,
                unreadCount: 0,
                participants: c.participants.map((p) =>
                  p.userId === currentUserId
                    ? {
                        ...p,
                        clearedAt: payload.clearedAt,
                        markedUnread: false,
                        lastReadAt: payload.clearedAt,
                      }
                    : p
                ),
              }
            : c
        );
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });

      if (payload.hiddenAt && currentChatId === payload.chatId) {
        useStore.getState().closeChat();
        router.navigate({ to: "/" });
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:status_changed", handleStatusChanged);
    socket.on("message:reaction_updated", handleReactionUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("chat:typing_updated", handleTypingUpdated);
    socket.on("presence:updated", handlePresenceUpdated);
    socket.on("user:profile_updated", handleProfileUpdated);
    socket.on("chat:participant_updated", handleParticipantUpdated);
    socket.on("chat:cleared", handleChatCleared);

    // Heartbeat every 30 seconds
    const heartbeatTimer = setInterval(() => {
      socket.emit("presence:heartbeat");
    }, 30000);

    return () => {
      clearInterval(heartbeatTimer);
      socket.off("message:new", handleNewMessage);
      socket.off("message:status_changed", handleStatusChanged);
      socket.off("message:reaction_updated", handleReactionUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("chat:typing_updated", handleTypingUpdated);
      socket.off("presence:updated", handlePresenceUpdated);
      socket.off("user:profile_updated", handleProfileUpdated);
      socket.off("chat:participant_updated", handleParticipantUpdated);
      socket.off("chat:cleared", handleChatCleared);
    };
  }, [queryClient, currentChatId, currentUserId]);
}
