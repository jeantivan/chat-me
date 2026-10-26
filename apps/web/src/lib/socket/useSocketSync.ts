import { useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { getSocket } from "./socketClient";
import { usePresenceStore } from "../store/presenceStore";
import {
  DELETED_MESSAGE_TOMBSTONE,
  type MessagePayload,
  type MessagesPageResponse,
  type ChatSummary,
  type ReceiptStatusPayload,
  type DeliveryStatus,
  type UserPresence,
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

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  detail: (chatId: string) => [...chatKeys.all, "detail", chatId] as const,
  messages: (chatId: string) => [...chatKeys.all, "messages", chatId] as const,
  starred: (chatId?: string | null) =>
    [...chatKeys.all, "starred", chatId || "all"] as const,
  contacts: ["contacts"] as const,
  user: ["user", "me"] as const,
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

    socket.on("message:new", handleNewMessage);
    socket.on("message:status_changed", handleStatusChanged);
    socket.on("message:reaction_updated", handleReactionUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("chat:typing_updated", handleTypingUpdated);
    socket.on("presence:updated", handlePresenceUpdated);

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
    };
  }, [queryClient, currentChatId, currentUserId]);
}
