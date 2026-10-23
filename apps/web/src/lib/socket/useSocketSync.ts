import { useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { getSocket } from "./socketClient";
import type {
  MessagePayload,
  MessagesPageResponse,
  ChatSummary,
} from "@chat-me/shared";

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  detail: (chatId: string) => [...chatKeys.all, "detail", chatId] as const,
  messages: (chatId: string) => [...chatKeys.all, "messages", chatId] as const,
  contacts: ["contacts"] as const,
  user: ["user", "me"] as const,
};

export function useSocketSync(currentChatId?: string | null) {
  const queryClient = useQueryClient();

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

      // 3. Emit delivery/read receipts
      if (currentChatId === newMsg.chatId) {
        socket.emit("message:ack_read", {
          chatId: newMsg.chatId,
          lastMessageId: newMsg.id,
        });
      } else {
        socket.emit("message:ack_received", {
          chatId: newMsg.chatId,
          messageIds: [newMsg.id],
        });
      }
    };

    const handleStatusChanged = ({
      messageId,
      chatId,
      status,
    }: {
      messageId: string;
      chatId: string;
      status: "received" | "read";
      userId: string;
      updatedAt: string;
    }) => {
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === messageId ? { ...m, status } : m
              ),
            })),
          };
        }
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:status_changed", handleStatusChanged);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:status_changed", handleStatusChanged);
    };
  }, [queryClient, currentChatId]);
}
