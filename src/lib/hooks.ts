import useStore from "./store";

export function useUserId() {
  return useStore((state) => state.user.id);
}

export function useCurrentChatId() {
  return useStore(({ currentChatId, setCurrentChatId }) => ({
    currentChatId,
    setCurrentChatId,
  }));
}

export function useTheme() {
  return useStore(({ theme, changeThemeMode, changeThemeColors }) => ({
    changeThemeColors,
    changeThemeMode,
    mode: theme.mode,
    colors: theme.colors,
  }));
}

export function useChatActions() {
  return useStore((state) => ({
    muteChat: state.muteChat,
    closeChat: state.closeChat,
    deleteChat: state.deleteChat,
  }));
}
