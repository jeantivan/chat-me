import { useCallback } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { getSocket } from "../socket/socketClient";
import { chatKeys } from "../socket/useSocketSync";
import { useUserId } from "../hooks";
import { getAuthHeaders } from "../auth/authClient";
import type {
  ChatSummary,
  MessagePayload,
  MessagesPageResponse,
} from "@chat-me/shared";

export function useChats() {
  return useQuery<ChatSummary[]>({
    queryKey: chatKeys.lists(),
    queryFn: async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${apiBase}/api/v1/chats`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch chats");
      return res.json();
    },
  });
}

export function useChatMessages(chatId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: async ({ pageParam }) => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const url = pageParam
        ? `${apiBase}/api/v1/chats/${chatId}/messages?limit=40&cursor=${encodeURIComponent(
            pageParam as string
          )}`
        : `${apiBase}/api/v1/chats/${chatId}/messages?limit=40`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<MessagesPageResponse>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: Boolean(chatId),
  });
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useCallback(
    (body: string) => {
      const socket = getSocket();
      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      const optimisticMessage: MessagePayload = {
        id: messageId,
        chatId,
        owner: userId,
        body,
        forwarded: false,
        time: now,
        status: "idle",
        starred: false,
        hasMedia: null,
        reactions: [],
      };

      // 1. Immediately append to TanStack Query cache with status: 'idle' (clock icon)
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) => {
          if (!oldData || !oldData.pages.length) {
            return {
              pages: [
                {
                  messages: [optimisticMessage],
                  nextCursor: null,
                  hasMore: false,
                },
              ],
              pageParams: [null],
            };
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page, idx) =>
              idx === 0
                ? { ...page, messages: [...page.messages, optimisticMessage] }
                : page
            ),
          };
        }
      );

      // 2. Dispatch over WebSocket with server acknowledgment
      socket.emit(
        "message:send",
        { id: messageId, chatId, body },
        (ack) => {
          if (ack?.success) {
            // Update status to 'send' (single tick)
            queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
              chatKeys.messages(chatId),
              (oldData) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  pages: oldData.pages.map((page) => ({
                    ...page,
                    messages: page.messages.map((m) =>
                      m.id === messageId ? { ...m, status: "send" } : m
                    ),
                  })),
                };
              }
            );
          }
        }
      );
    },
    [chatId, queryClient, userId]
  );
}
