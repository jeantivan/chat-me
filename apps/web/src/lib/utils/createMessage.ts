import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { TMessage } from "@/lib/types";

export const createMessage = ({
  chatId,
  owner,
  body = ""
}: {
  chatId: string;
  owner: string;
  body?: string;
}): TMessage => ({
  id: uuid(),
  chatId,
  owner,
  body,
  starred: false,
  forwarded: false,
  hasMedia: null,
  status: "read",
  reactions: [],
  time: dayjs().toISOString()
});
