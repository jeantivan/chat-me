import { eq, and, sql, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Server as SocketIOServer } from "socket.io";
import { chatParticipants, messageReceipts } from "../db/schema.js";
import type {
  DeliveryStatus,
  ClientToServerEvents,
  ServerToClientEvents,
  ReceiptStatusPayload,
} from "@chat-me/shared";

export function computeStatusFromReceipts(
  senderId: string,
  currentUserId: string,
  otherParticipantIds: string[],
  receiptsForMessage: Array<{ userId: string; status: string }>
): DeliveryStatus {
  if (senderId === currentUserId) {
    if (otherParticipantIds.length === 0) return "send";

    const isAllRead =
      otherParticipantIds.every((id) =>
        receiptsForMessage.some((r) => r.userId === id && r.status === "read")
      );
    if (isAllRead) return "read";

    const isAllReceived =
      otherParticipantIds.every((id) =>
        receiptsForMessage.some(
          (r) => r.userId === id && (r.status === "received" || r.status === "read")
        )
      );
    if (isAllReceived) return "received";

    return "send";
  } else {
    const myReceipt = receiptsForMessage.find((r) => r.userId === currentUserId);
    if (myReceipt?.status === "read") return "read";
    if (myReceipt?.status === "received") return "received";
    return "send";
  }
}

export async function computeAggregatedStatus(
  app: FastifyInstance,
  chatId: string,
  messageId: string,
  senderId: string
): Promise<DeliveryStatus> {
  const otherParticipants = await app.db
    .select({ userId: chatParticipants.userId })
    .from(chatParticipants)
    .where(
      and(
        eq(chatParticipants.chatId, chatId),
        sql`${chatParticipants.userId} <> ${senderId}`
      )
    );

  if (otherParticipants.length === 0) return "send";

  const otherIds = otherParticipants.map((p) => p.userId);
  const receipts = await app.db
    .select({ userId: messageReceipts.userId, status: messageReceipts.status })
    .from(messageReceipts)
    .where(
      and(
        eq(messageReceipts.messageId, messageId),
        inArray(messageReceipts.userId, otherIds)
      )
    );

  return computeStatusFromReceipts(senderId, senderId, otherIds, receipts);
}

export async function computeMessageStatusForViewer(
  app: FastifyInstance,
  chatId: string,
  messageId: string,
  senderId: string,
  viewerUserId: string
): Promise<DeliveryStatus> {
  if (viewerUserId === senderId) {
    return computeAggregatedStatus(app, chatId, messageId, senderId);
  }

  const myReceipt = await app.db
    .select({ status: messageReceipts.status })
    .from(messageReceipts)
    .where(
      and(
        eq(messageReceipts.messageId, messageId),
        eq(messageReceipts.userId, viewerUserId)
      )
    )
    .limit(1);

  if (myReceipt.length > 0) {
    return myReceipt[0].status as DeliveryStatus;
  }

  return "send";
}

export async function processAndBroadcastReceipt(
  app: FastifyInstance,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, any, any>,
  chatId: string,
  messageId: string,
  senderId: string,
  ackUserId: string,
  ackStatus: "received" | "read",
  participants: Array<{ userId: string }>,
  now: Date
): Promise<void> {
  const aggregatedStatus = await computeAggregatedStatus(
    app,
    chatId,
    messageId,
    senderId
  );

  const rooms = [
    `chat:${chatId}`,
    ...participants.map((p) => `user:${p.userId}`),
  ];

  const receiptPayload: ReceiptStatusPayload = {
    messageId,
    chatId,
    status: ackStatus,
    userId: ackUserId,
    updatedAt: now.toISOString(),
  };

  io.to(rooms).emit("receipt:updated", receiptPayload);

  if (aggregatedStatus === "received" || aggregatedStatus === "read") {
    const statusPayload: ReceiptStatusPayload = {
      messageId,
      chatId,
      status: aggregatedStatus,
      userId: senderId,
      updatedAt: now.toISOString(),
    };
    io.to(rooms).emit("message:status_changed", statusPayload);
  }
}
