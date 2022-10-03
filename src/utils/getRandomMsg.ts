import { MessageType } from "../types";
import LAST_MESSAGES from "../assets/mock-data/last-messages.json";

export const getRandomMsg = (): MessageType =>
  LAST_MESSAGES[
    Math.floor(Math.random() * LAST_MESSAGES.length)
  ] as MessageType;
