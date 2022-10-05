import { ContactType, ChatType } from "../types";
import { useQuery } from "react-query";
import LAST_MESSAGES from "../assets/mock-data/last-messages.json";

const getRandomMessage = () =>
  LAST_MESSAGES[Math.floor(Math.random() * LAST_MESSAGES.length)];

const formatContactInfo = (contact: any) => ({
  contact: {
    ...contact,
    name: {
      ...contact.name,
      fullName: `${contact.name.first} ${contact.name.last}`,
    },
  },
  pinned: false,
  mutedNotf: false,
  lastMessage: getRandomMessage(),
});

const getChats = async (): Promise<ChatType[]> => {
  try {
    const response = await fetch(
      "https://randomuser.me/api/?results=20&inc=name,phone,picture,id&noinfo"
    );

    const data = await response.json();

    const { results } = data;

    const chats: ChatType[] = results.map(formatContactInfo);

    return chats;
  } catch (e: any) {
    console.error(`Ups! Algo salió mal.`, e);
    throw new Error(e);
  }
};

export const useGetChats = () =>
  useQuery("chats", getChats, {
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
  });
