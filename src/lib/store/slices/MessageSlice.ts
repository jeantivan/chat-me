import { StateCreator } from "zustand";
import { MessageSlice, StoreSlice } from "./interfaces";
import { ReactionType } from "@/lib/types";

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
  updateMessageStatus: (messageId, chatId) => {
    // Investigar una buena manera de implementar la acción
    // const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);
    // if (chatIndex !== undefined) {
    //   set((state) => {
    //     let messageIndex = state.chats[chatIndex].messages.findIndex(
    //       (msg) => msg.id === messageId
    //     );
    //     switch (state.chats[chatIndex].messages[messageIndex].status) {
    //       case "idle":
    //         state.chats[chatIndex].messages[messageIndex].status = "send";
    //         break;
    //       case "send":
    //         state.chats[chatIndex].messages[messageIndex].status = "received";
    //         break;
    //       case "received":
    //         state.chats[chatIndex].messages[messageIndex].status = "read";
    //         break;
    //       default:
    //         break;
    //     }
    //     state.chats[chatIndex].messages[messageIndex].status = "send";
    //   });
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
  addReaction: (messageId, reactionType, chatId) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== undefined) {
      set((state) => {
        // Encuentra el index del Mensaje con id = messageId
        let indexOfMessage = state.chats[chatIndex].messages.findIndex(
          (message) => message.id === messageId
        );

        if (indexOfMessage) {
          let reaction: ReactionType = {
            reaction: {
              isOwnReaction: true,
              type: reactionType,
            },
          };

          state.chats[chatIndex].messages[indexOfMessage].reactions.push(
            reaction as never
          );
        }
      });
    }
  },
  deleteReaction: (messageId, chatId) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== undefined) {
      set((state) => {
        // Encuentra el index del Mensaje con id = messageId
        let indexOfMessage = state.chats[chatIndex].messages.findIndex(
          (message) => message.id === messageId
        );

        if (indexOfMessage) {
          state.chats[chatIndex].messages[indexOfMessage].reactions =
            state.chats[chatIndex].messages[indexOfMessage].reactions.filter(
              ({ reaction }) => !reaction.isOwnReaction
            );
        }
      });
    }
  },
  changeReaction: (messageId, reactionType, chatId) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== undefined) {
      set((state) => {
        // Encuentra el index del Mensaje con id = messageId
        let indexOfMessage = state.chats[chatIndex].messages.findIndex(
          (message) => message.id === messageId
        );

        if (indexOfMessage) {
          state.chats[chatIndex].messages[indexOfMessage].reactions =
            state.chats[chatIndex].messages[indexOfMessage].reactions.map(
              ({ reaction }) =>
                !reaction.isOwnReaction
                  ? { reaction }
                  : { reaction: { ...reaction, type: reactionType } }
            );
        }
      });
    }
  },
});
