import { TUser } from "../types";

export const getContacts = async (): Promise<TUser[]> => {
  return await import("../../assets/mock-data/contacts.json").then(
    (res) => res.default
  );
};
