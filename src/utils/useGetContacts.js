import { useQuery } from "react-query";
import { LAST_MESSAGES } from "./constants";

const getRandomMessage = () =>
  LAST_MESSAGES[Math.floor(Math.random() * LAST_MESSAGES.length)];

const fetchContacts = () =>
  fetch(
    "https://randomuser.me/api/?results=20&inc=gender,name,phone,picture,id&noinfo"
  )
    .then((res) => res.json())
    .then((data) => {
      const { results } = data;

      const newResults = results.map((result) => ({
        ...result,
        name: {
          ...result.name,
          fullName: `${result.name.first} ${result.name.last}`,
        },
        lastMessage: getRandomMessage(),
      }));

      return newResults;
    });

export const useGetContacts = () =>
  useQuery("contacts", fetchContacts, {
    refetchOnWindowFocus: false,
    cacheTime: Infinity,
  });
