import { MessageType } from "./../types";
import MESSAGES from "../assets/mock-data/messages.json";
import { shuffle } from "lodash";
let example = {
  id: "cfbeb39d-bae3-47a8-be05-525335de3ce8",
  status: "read",
  isOwnMsg: true,
  isFavMsg: false,
  time: "7:51 PM",
  reactions: [],
  message: { type: "video", content: 77, orientation: "landscape" },
};

// Obtiene el resto de los mensajes desde la Mock Data
// Y los mezcla para simular mensajes distintos en cada chat

export const getRestMsg = (): MessageType[] => {
  return shuffle<MessageType>(MESSAGES as MessageType[]);
};
