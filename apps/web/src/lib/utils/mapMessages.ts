import shuffle from "lodash/shuffle";
import dayjs from "dayjs";
import { TMessage, TUser } from "@/lib/types";

const allMessages = (await import("../../assets/mock-data/messages.json").then(
  (res) => res.default
)) as TMessage[];

const wrapInLexicalEditor = (body: string) =>
  `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"${body}","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`;

export const mapMessages = (contact: TUser, chatId: string): TMessage[] => {
  const qty = Math.floor(Math.random() * 40 + 1);
  const messages = shuffle(allMessages)
    .slice(0, qty)
    .map((message, i) => {
      const newTime = dayjs()
        .subtract(5 * (qty - i), "minutes")
        .toISOString();

      const owner = message.owner === null ? contact.id : message.owner;

      const body = wrapInLexicalEditor(message.body);

      return {
        ...message,
        chatId,
        time: newTime,
        owner,
        body
      };
    });

  return messages;
};
