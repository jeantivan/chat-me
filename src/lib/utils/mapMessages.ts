import shuffle from "lodash/shuffle";
import dayjs from "dayjs";
import { TMessage, TUser } from "@/lib/types";

const allMessages = (await import("../../assets/mock-data/messages.json").then(
  (res) => res.default
)) as TMessage[];

export const mapMessages = (contact: TUser, chatId: string): TMessage[] => {
  const qty = Math.floor(Math.random() * 40 + 1);
  const messages = shuffle(allMessages)
    .slice(0, qty)
    .map((message, i) => {
      const newTime = dayjs()
        .subtract(5 * (qty - i), "minutes")
        .toISOString();

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
