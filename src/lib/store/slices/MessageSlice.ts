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
  addMessage: (message) => {
    const chatIndex = get().chats.findIndex(
      (chat) => chat.id === message.chatId
    );

    if (chatIndex < 0) return;

    set((state) => {
      state.chats[chatIndex].messages.push(message);
    });
  },

  deleteMessage: (message) => {
    const chatIndex = get().chats.findIndex(
      (chat) => chat.id === message.chatId
    );

    if (chatIndex < 0) return;

    set((state) => {
      // Encuentra el index del Mensaje con id = messageId
      let messageIndex = state.chats[chatIndex].messages.findIndex(
        (m) => m.id === message.id
      );

      if (messageIndex < 0) return;

      state.chats[chatIndex].messages.splice(messageIndex, 1);
    });
  },
  starMessage: (message) => {
    const chatIndex = get().chats.findIndex(
      (chat) => chat.id === message.chatId
    );

    if (chatIndex < 0) return;

    set((state) => {
      // Encuentra el index del Mensaje con id = messageId
      let messageIndex = state.chats[chatIndex].messages.findIndex(
        (m) => m.id === message.id
      );

      if (messageIndex) {
        state.chats[chatIndex].messages[messageIndex].starred =
          !state.chats[chatIndex].messages[messageIndex].starred;
      }
    });
  },
  addReaction: (message, reaction) => {
    const chatIndex = get().chats.findIndex(
      (chat) => chat.id === message.chatId
    );

    if (chatIndex < 0) return;

    set((state) => {
      // Encuentra la posición del mensaje
      let messageIndex = state.chats[chatIndex].messages.findIndex(
        (m) => m.id === message.id
      );

      if (messageIndex < 0) return;

      state.chats[chatIndex].messages[messageIndex].reactions.push(reaction);
    });
  },
  changeReaction: (message, reaction) => {
    const userId = get().user.id;
    const chatIndex = get().chats.findIndex(
      (chat) => chat.id === message.chatId
    );

    if (chatIndex < 0) return;

    set((state) => {
      // Encuentra la posición del mensaje
      let messageIndex = state.chats[chatIndex].messages.findIndex(
        (m) => m.id === message.id
      );

      if (messageIndex < 0) return;

      const { reactions } = state.chats[chatIndex].messages[messageIndex];

      state.chats[chatIndex].messages[messageIndex].reactions = [
        ...reactions.filter((r) => r.owner !== userId),
        reaction,
      ];
    });
  },

  deleteReaction: (message) => {
    const userId = get().user.id;
    const chatIndex = get().chats.findIndex(
      (chat) => chat.id === message.chatId
    );

    if (chatIndex < 0) return;

    set((state) => {
      // Encuentra la posición del mensaje
      let messageIndex = state.chats[chatIndex].messages.findIndex(
        (m) => m.id === message.id
      );

      if (messageIndex < 0) return;

      const { reactions } = state.chats[chatIndex].messages[messageIndex];

      state.chats[chatIndex].messages[messageIndex].reactions = [
        ...reactions.filter((r) => r.owner !== userId),
      ];
    });
  },
});
