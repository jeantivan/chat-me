import shuffle from "lodash/shuffle";
import dayjs from "dayjs";
import { TUser } from "@/lib/types";

export const mapMessages = (
  mockMessages: any,
  contact: TUser,
  chatId: string
) => {
  const qty = Math.floor(Math.random() * 40 + 1);
  const messages = shuffle(mockMessages)
    .slice(0, qty)
    .map((message, i) => {
      const newTime = dayjs()
        .subtract(5 * (qty - i), "minutes")
        .unix();

      const owner = message.owner === null ? contact.id : message.owner;

      return {
        ...message,
        chatId,
        time: newTime,
        owner,
      };
    });

  return messages;
};
