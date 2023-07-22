import { shuffle } from "lodash";
import { v4 as uuid } from "uuid";
import { TChat, TUser } from "@/lib/types";
import { mapMessages } from "./mapMessages";

const allMessages = await import("../../assets/mock-data/messages.json").then(
  (res) => res.default
);

export const getChats = (contacts: TUser[]) => {
  const randomChats = shuffle(contacts).slice(0, 10);

  const randomPinnedChat = Math.floor(Math.random() * randomChats.length);

  const chats: TChat[] = randomChats.map((contact, index) => {
    const id = uuid();
    return {
      id,
      participants: [contact],
      pinned: randomPinnedChat === index,
      muted: false,
      archived: false,
      hasUnreadMsg: 0,
      messages: mapMessages(allMessages, contact, id),
    };
  });

  return chats;
};
