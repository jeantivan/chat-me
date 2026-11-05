import { inArray, eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  users,
  contacts,
  chats,
  chatParticipants,
  messages,
  messageReceipts,
  generateDirectPairHash,
} from "../db/schema.js";

export const STARTER_DEMO_EMAILS = [
  "alice@example.com",
  "bob@example.com",
  "charlie@example.com",
  "diana@example.com",
] as const;

export function makeLexicalBody(text: string): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
}

export async function seedStarterOnboarding(
  tx: any,
  newUserId: string
): Promise<void> {
  const demoUsers = await tx
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, [...STARTER_DEMO_EMAILS]));

  if (demoUsers.length === 0) {
    return;
  }

  // 1. Establish bidirectional contacts
  const contactPairs = demoUsers
    .filter((d: { id: string }) => d.id !== newUserId)
    .flatMap((d: { id: string }) => [
      { userId: newUserId, contactUserId: d.id },
      { userId: d.id, contactUserId: newUserId },
    ]);

  if (contactPairs.length > 0) {
    await tx.insert(contacts).values(contactPairs).onConflictDoNothing();
  }

  // 2. Add as participant to Engineering & Architecture group if present
  const [engGroup] = await tx
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.type, "group"), eq(chats.title, "Engineering & Architecture")))
    .limit(1);

  if (engGroup) {
    await tx
      .insert(chatParticipants)
      .values({
        chatId: engGroup.id,
        userId: newUserId,
        role: "member",
      })
      .onConflictDoNothing();
  }

  // 3. Create initial direct chat with alice@example.com containing welcome message
  const alice = demoUsers.find((d: { email: string }) => d.email === "alice@example.com");
  if (alice && alice.id !== newUserId) {
    const pairHash = generateDirectPairHash(newUserId, alice.id);
    let aliceChatId: string;

    const [existingChat] = await tx
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.directPairHash, pairHash))
      .limit(1);

    if (existingChat) {
      aliceChatId = existingChat.id;
    } else {
      const [newChat] = await tx
        .insert(chats)
        .values({
          type: "direct",
          directPairHash: pairHash,
        })
        .returning({ id: chats.id });
      aliceChatId = newChat.id;

      await tx
        .insert(chatParticipants)
        .values([
          { chatId: aliceChatId, userId: newUserId, role: "member" },
          { chatId: aliceChatId, userId: alice.id, role: "member" },
        ])
        .onConflictDoNothing();
    }

    const welcomeBody = makeLexicalBody(
      "Welcome to ChatMe! Feel free to explore features, send messages, or check out our Engineering & Architecture group."
    );

    const welcomeMsgId = randomUUID();
    const [welcomeMessage] = await tx
      .insert(messages)
      .values({
        id: welcomeMsgId,
        chatId: aliceChatId,
        senderId: alice.id,
        body: welcomeBody,
      })
      .returning({ id: messages.id });

    await tx
      .insert(messageReceipts)
      .values({
        messageId: welcomeMessage.id,
        userId: newUserId,
        status: "received",
      })
      .onConflictDoNothing();
  }
}
