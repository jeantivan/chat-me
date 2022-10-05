import { StateCreator } from "zustand";
import { MessageSlice, StoreSlice } from "./interfaces";

export const createMessageSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  MessageSlice
> = (set, get) => ({
  addMessage: (message, chatId) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== undefined) {
      set((state) => {
        state.chats[chatIndex].messages.push(message);
      });
    }
  },
  updateMessageStatus: (messageId) => {
    // set(state => {
    //   let indexOfNewMessage = state.chats[
    //     indexOfCurrentChat
    //   ].messages.findIndex((msg) => msg.id === message.id);
    //   let newMessage =
    //     state.chats[indexOfCurrentChat].messages[indexOfNewMessage];
    // })
    // switch (newMessage.status) {
    //   case "idle":
    //     newMessage.status = "send";
    //     break;
    //   case "send":
    //     newMessage.status = "received";
    //     break;
    //   case "received":
    //     newMessage.status = "read";
    //     break;
    //   default:
    //     break;
    // }
  },
  deleteMessage: (messageId, chatId) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== undefined) {
      set((state) => {
        // Encuentra el index del Mensaje con id = messageId
        let indexOfMessage = state.chats[chatIndex].messages.findIndex(
          (message) => message.id === messageId
        );
        if (indexOfMessage !== undefined) {
          state.chats[chatIndex].messages.splice(indexOfMessage, 1);
        }
      });
    }
  },
  toggleFavMessage: (messageId, chatId) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== undefined) {
      set((state) => {
        // Encuentra el index del Mensaje con id = messageId
        let indexOfMessage = state.chats[chatIndex].messages.findIndex(
          (message) => message.id === messageId
        );

        if (indexOfMessage) {
          state.chats[chatIndex].messages[indexOfMessage].isFavMsg =
            !state.chats[chatIndex].messages[indexOfMessage].isFavMsg;
        }
      });
    }
  },
});
