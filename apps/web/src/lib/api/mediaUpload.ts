import { useCallback } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import type { MessagesPageResponse, MessagePayload } from "@chat-me/shared";
import { chatKeys, patchMessageStatusInPages } from "../socket/useSocketSync";
import { extractMediaMetadata } from "../utils/mediaMetadata";
import { getSocket } from "../socket/socketClient";
import { getAccessToken } from "../auth/authClient";
import { useUserId } from "../hooks";
import type { TMedia } from "../types";

export function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during media upload"));
    xhr.send(file);
  });
}

function patchMediaInPages(
  oldData: InfiniteData<MessagesPageResponse> | undefined,
  messageId: string,
  updater: (media: TMedia) => Partial<TMedia>
): InfiniteData<MessagesPageResponse> | undefined {
  if (!oldData) return oldData;
  return {
    ...oldData,
    pages: oldData.pages.map((page: MessagesPageResponse) => ({
      ...page,
      messages: page.messages.map((m: MessagePayload) =>
        m.id === messageId && m.hasMedia
          ? {
              ...m,
              hasMedia: {
                ...m.hasMedia,
                ...updater(m.hasMedia as any),
              },
            }
          : m
      ),
    })),
  };
}

export function useSendMediaMessage(chatId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useCallback(
    async (file: File, caption?: string) => {
      const socket = getSocket();
      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 1. Extract dimensions, orientation, duration, blurhash client-side
      const metadata = await extractMediaMetadata(file);
      const isVideo = file.type.startsWith("video/");
      const mediaType = isVideo ? "video" : "image";

      const optimisticMedia: TMedia = {
        type: mediaType,
        src: metadata.localPreviewUrl,
        orientation: metadata.orientation || "square",
        duration: metadata.duration ?? null,
        blurhash: metadata.blurhash ?? null,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        uploadProgress: 0,
      };

      const optimisticMessage: MessagePayload = {
        id: messageId,
        chatId,
        owner: userId,
        body: caption || "",
        forwarded: false,
        time: now,
        status: "idle",
        starred: false,
        hasMedia: optimisticMedia as any,
        reactions: [],
      };

      // 2. Stage optimistic message in TanStack Query cache
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

      try {
        // 3. Request presigned upload URL from Fastify
        const token = getAccessToken();
        const presignRes = await fetch(`/api/v1/chats/${chatId}/media/presign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            type: mediaType,
            orientation: metadata.orientation,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            blurhash: metadata.blurhash,
          }),
        });

        if (!presignRes.ok) {
          throw new Error(`Failed to request presigned URL: ${presignRes.status}`);
        }

        const { mediaId, uploadUrl, publicUrl } = await presignRes.json();

        // 4. Direct binary HTTP PUT with progress tracking
        await uploadToPresignedUrl(uploadUrl, file, (progress) => {
          queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
            chatKeys.messages(chatId),
            (oldData) =>
              patchMediaInPages(oldData, messageId, () => ({
                uploadProgress: progress,
              }))
          );
        });

        // 5. Send message via Socket.IO with atomically linked mediaId
        socket.emit(
          "message:send",
          {
            id: messageId,
            chatId,
            body: caption || "",
            mediaId,
          },
          (ack) => {
            if (ack?.success) {
              URL.revokeObjectURL(metadata.localPreviewUrl);
              queryClient.setQueryData<InfiniteData<MessagesPageResponse>>(
                chatKeys.messages(chatId),
                (oldData) => {
                  const updated = patchMessageStatusInPages(oldData, messageId, "send");
                  return patchMediaInPages(updated, messageId, () => ({
                    src: publicUrl,
                    uploadProgress: undefined,
                  }));
                }
              );
            }
          }
        );
      } catch (err) {
        console.error("Media upload error:", err);
      }
    },
    [chatId, queryClient, userId]
  );
}
