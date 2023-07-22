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
