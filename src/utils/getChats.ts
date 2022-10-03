import { getRandomMsg } from "./getRandomMsg";
import { getContacts } from "./getContacts";
import { shuffle } from "lodash";
import { v4 as uuidv4 } from "uuid";

export const getChats = () => {
  // Choose 20 random contacts from the original array
  const contacts = shuffle(getContacts()).slice(0, 20);

  const randomPinnedChat = Math.floor(Math.random() * 20);

  const chats = contacts.map((contact, index) => ({
    id: uuidv4(),
    contact,
    isPinned: randomPinnedChat === index,
    isMuted: false,
    isArchived: false,
    hasUnreadMsg: false,
    shouldLoadOldMsg: true,
    messages: [getRandomMsg()],
  }));

  return chats;
};
