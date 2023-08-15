import { shuffle } from "lodash";
import { v4 as uuid } from "uuid";
import { TChat, TUser } from "@/lib/types";
import { mapMessages } from "./mapMessages";

const allMessages = await import("../../assets/mock-data/messages.json").then(
  (res) => res.default
);

export const getChats = (contacts: TUser[]) => {
  const randomChats = shuffle(contacts).slice(0, 20);

  const randomPinnedChat = Math.floor(Math.random() * randomChats.length);

  const chats: TChat[] = randomChats.map((contact, index) => {
    const id = uuid();
    return {
      id,
      participants: [contact],
      pinned: randomPinnedChat === index,
      muted: false,
      archived: 35 % index === 0 || 25 % index === 0,
      hasUnreadMsg: 0,
      messages: mapMessages(allMessages, contact, id),
    };
  });

  return chats;
};
