import CONTACTS from "../../assets/mock-data/contacts.json";
import { UserType } from "../../types";

export const getContacts = (): UserType[] => {
  return CONTACTS.contacts;
};
