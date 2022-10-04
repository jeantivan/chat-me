import { StateCreator } from "zustand";
import { getContacts } from "../../utils/getContacts";
import { ContactsSlice, StoreSlice } from "./interfaces";

export const createContactsSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  ContactsSlice
> = () => ({
  contacts: getContacts(),
});
