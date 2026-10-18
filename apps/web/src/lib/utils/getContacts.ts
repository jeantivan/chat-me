import orderBy from "lodash/orderBy";
import { TUser } from "@/lib/types";

export const getContacts = async (): Promise<TUser[]> => {
  return await import("../../assets/mock-data/contacts.json").then((res) =>
    orderBy(res.default, "name[0]")
  );
};
