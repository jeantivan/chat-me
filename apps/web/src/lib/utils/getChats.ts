import { shuffle } from "lodash";
import { v4 as uuid } from "uuid";
import { TChat, TUser } from "@/lib/types";
import { mapMessages } from "./mapMessages";

export const getChats = (contacts: TUser[]) => {
  const allChats = shuffle(contacts);
  const randomPinnedChat = Math.floor(Math.random() * 20);

  const chatsWithMessages: TChat[] = allChats
    .slice(0, 20)
    .map((contact, index) => {
      const id = uuid();

      return {
        id,
        participants: [contact],
        pinned: randomPinnedChat === index,
        muted: false,
        archived: 35 % index === 0 || 25 % index === 0,
        hasUnreadMsg: 0,
        messages: mapMessages(contact, id),
      };
    });

  const emptyChats: TChat[] = allChats.slice(21).map((contact) => {
    const id = uuid();
    return {
      id,
      participants: [contact],
      pinned: false,
      muted: false,
      archived: false,
      hasUnreadMsg: 0,
      messages: [],
    };
  });

  return [...chatsWithMessages, ...emptyChats];
};
