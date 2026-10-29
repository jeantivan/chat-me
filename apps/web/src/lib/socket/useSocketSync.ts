import { useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { getSocket } from "./socketClient";
import { usePresenceStore } from "../store/presenceStore";
import useStore from "../store";
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

export function isChatParticipantMuted(
  queryClient: { getQueryData: <T>(key: readonly unknown[]) => T | undefined },
  chatId: string,
  userId?: string
): boolean {
  if (!userId) return false;
  const chatList = queryClient.getQueryData<ChatSummary[]>(chatKeys.lists());
  const currentChat = chatList?.find((c) => c.id === chatId);
  return currentChat?.participants.find((p) => p.userId === userId)?.muted ?? false;
}

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  detail: (chatId: string) => [...chatKeys.all, "detail", chatId] as const,
  messages: (chatId: string) => [...chatKeys.all, "messages", chatId] as const,
  starred: (chatId?: string | null) =>
    [...chatKeys.all, "starred", chatId || "all"] as const,
  contacts: ["contacts"] as const,
  user: ["user", "me"] as const,
  settings: ["user", "settings"] as const,
};

export function useSocketSync(
  currentChatId?: string | null,
  currentUserId?: string
) {
  const queryClient = useQueryClient();

  // Reset unreadCount in chat list cache immediately upon viewing active chat
  useEffect(() => {
    if (!currentChatId) return;
    queryClient.setQueryData<ChatSummary[]>(chatKeys.lists(), (oldChats) => {
      if (!oldChats) return oldChats;
      return oldChats.map((c) =>
        c.id === currentChatId ? { ...c, unreadCount: 0 } : c
      );
    });
  }, [currentChatId, queryClient]);

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
      const isMuted = isChatParticipantMuted(queryClient, newMsg.chatId, currentUserId);
      const settings = useStore.getState().notifications;

      handleInboundMessageNotification({
        message: newMsg,
        currentUserId,
        currentChatId,
        isChatMuted: isMuted,
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
      usePresenceStore.getState().setPresence(userId, { status, lastSeenAt });
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

    socket.on("message:new", handleNewMessage);
    socket.on("message:status_changed", handleStatusChanged);
    socket.on("message:reaction_updated", handleReactionUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("chat:typing_updated", handleTypingUpdated);
    socket.on("presence:updated", handlePresenceUpdated);
    socket.on("user:profile_updated", handleProfileUpdated);

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
    };
  }, [queryClient, currentChatId, currentUserId]);
}
