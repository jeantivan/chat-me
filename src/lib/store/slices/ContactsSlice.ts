import { StateCreator } from "zustand";
import { ContactsSlice, StoreSlice } from "./interfaces";
import { getContacts } from "@/lib/utils/getContacts";

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
