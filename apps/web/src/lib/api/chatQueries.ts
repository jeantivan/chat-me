import { useCallback } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { getSocket } from "../socket/socketClient";
import {
  chatKeys,
  patchMessageInPages,
  patchMessageStatusInPages,
} from "../socket/useSocketSync";
import { useUserId } from "../hooks";
import { getAuthHeaders } from "../auth/authClient";
import { useAuth } from "../auth/AuthContext";
import {
  DELETED_MESSAGE_TOMBSTONE,
  type ChatSummary,
  type MessagePayload,
  type MessagesPageResponse,
  type ContactSummary,
} from "@chat-me/shared";

function useSafeAuth(): { isAuthenticated: boolean; token: string | null } {
  try {
    return useAuth();
  } catch {
    return { isAuthenticated: false, token: null };
  }
}

export function useChats() {
  const { isAuthenticated, token } = useSafeAuth();
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
    enabled: Boolean(isAuthenticated && token),
  });
}

export function useContacts() {
  const { isAuthenticated, token } = useSafeAuth();
  return useQuery<ContactSummary[]>({
    queryKey: chatKeys.contacts,
    queryFn: async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${apiBase}/api/v1/contacts`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
    enabled: Boolean(isAuthenticated && token),
  });
}

export function useChatMessages(chatId: string) {
  const { isAuthenticated, token } = useSafeAuth();
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
    enabled: Boolean(isAuthenticated && token && chatId),
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
              (oldData) => patchMessageStatusInPages(oldData, messageId, "send")
            );
          }
        }
      );
    },
    [chatId, queryClient, userId]
  );
}

export function useStarredMessages(chatId?: string | null) {
  const { isAuthenticated, token } = useSafeAuth();
  return useQuery<MessagePayload[]>({
    queryKey: chatKeys.starred(chatId),
    queryFn: async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const url = chatId
        ? `${apiBase}/api/v1/chats/starred?chatId=${encodeURIComponent(chatId)}`
        : `${apiBase}/api/v1/chats/starred`;
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch starred messages");
      return res.json();
    },
    enabled: Boolean(isAuthenticated && token),
  });
}

export function useReactToMessage() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useCallback(
    (messageId: string, chatId: string, emoji: string | null) => {
      // Optimistic update in TanStack Query cache
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) =>
          patchMessageInPages(oldData, messageId, (m) => {
            const filtered = (m.reactions || []).filter(
              (r) => r.owner !== userId
            );
            return {
              ...m,
              reactions: emoji
                ? [...filtered, { owner: userId, type: emoji }]
                : filtered,
            };
          })
      );

      const socket = getSocket();
      socket.emit("message:reaction", { messageId, chatId, emoji });
    },
    [queryClient, userId]
  );
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useCallback(
    (messageId: string, chatId: string) => {
      // Optimistic tombstone in TanStack Query cache
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) =>
          patchMessageInPages(oldData, messageId, (m) => ({
            ...m,
            body: DELETED_MESSAGE_TOMBSTONE,
            deleted: true,
            hasMedia: null,
          }))
      );

      queryClient.setQueryData<ChatSummary[]>(
        chatKeys.lists(),
        (oldChats) => {
          if (!oldChats) return oldChats;
          return oldChats.map((c) =>
            c.id === chatId && c.lastMessage?.id === messageId
              ? {
                  ...c,
                  lastMessage: {
                    ...c.lastMessage,
                    body: DELETED_MESSAGE_TOMBSTONE,
                    deleted: true,
                    hasMedia: null,
                  },
                }
              : c
          );
        }
      );

      const socket = getSocket();
      socket.emit("message:delete", { messageId, chatId });
    },
    [queryClient]
  );
}

export function useToggleStarMessage() {
  const queryClient = useQueryClient();

  return useCallback(
    async (messageId: string, chatId: string) => {
      // Optimistically toggle starred flag in messages cache
      queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
        chatKeys.messages(chatId),
        (oldData) =>
          patchMessageInPages(oldData, messageId, (m) => ({
            ...m,
            starred: !m.starred,
          }))
      );

      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(
          `${apiBase}/api/v1/chats/${chatId}/messages/${messageId}/star`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );
        if (res.ok) {
          queryClient.invalidateQueries({
            queryKey: [...chatKeys.all, "starred"],
          });
        }
      } catch {
        // Ignore error
      }
    },
    [queryClient]
  );
}

export function useForwardMessages() {
  const queryClient = useQueryClient();

  return useCallback(
    async (params: {
      messageIds: string[];
      targetChatIds?: string[];
      targetUserIds?: string[];
    }) => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${apiBase}/api/v1/chats/forward`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(params),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      }
      return res.ok;
    },
    [queryClient]
  );
}
