import { Contact } from "./../types";
import { useQuery } from "react-query";
import { LAST_MESSAGES } from "./constants";

const getRandomMessage = () =>
  LAST_MESSAGES[Math.floor(Math.random() * LAST_MESSAGES.length)];

const fetchContacts = async (): Promise<Array<Contact> | undefined> => {
  try {
    const response = await fetch(
      "https://randomuser.me/api/?results=20&inc=name,phone,picture,id&noinfo"
    );

    const data = await response.json();

    const { results } = data;

    const newResults = results.map((result: any) => ({
      ...result,
      name: {
        ...result.name,
        fullName: `${result.name.first} ${result.name.last}`,
      },

      lastMessage: undefined,
    }));

    return newResults as Array<Contact>;
  } catch (e) {
    console.error(`Ups! Algo salió mal.`, e);
    return;
  }
};

export const useGetContacts = () =>
  useQuery("contacts", fetchContacts, {
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
  });
