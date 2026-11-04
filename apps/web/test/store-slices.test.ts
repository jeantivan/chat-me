import { describe, it, expect, beforeEach } from "vitest";
import useStore from "../src/lib/store";

describe("Zustand Store Slices (ADR 0003 & Legacy State Purge)", () => {
  beforeEach(() => {
    useStore.getState().resetUserProfile();
    useStore.getState().closeChat();
    useStore.getState().resetInChatSearch();
  });

  describe("ProfileSlice Neutralization & Contacts Removal", () => {
    it("initializes with clean neutral fallback user profile and no contacts", () => {
      const state = useStore.getState();

      expect(state.user).toEqual({
        id: "",
        name: "",
        bio: "",
        phone: "",
        picture: "",
      });

      // Server collections must not exist on store (ADR 0003)
      expect((state as unknown as Record<string, unknown>).contacts).toBeUndefined();
    });

    it("resets user profile to clean neutral defaults on resetUserProfile", () => {
      const state = useStore.getState();

      state.setUserProfile({
        id: "custom-user-id",
        name: "Custom Name",
        bio: "Custom Bio",
      });

      expect(useStore.getState().user.id).toBe("custom-user-id");

      useStore.getState().resetUserProfile();

      const resetState = useStore.getState();
      expect(resetState.user.id).toBe("");
      expect(resetState.user.name).toBe("");
      expect(resetState.user.bio).toBe("");
      expect((resetState as unknown as Record<string, unknown>).contacts).toBeUndefined();
    });
  });

  describe("CurrentChatIdSlice Decoupling", () => {
    it("updates currentChatId and resets in-chat search query without depending on chats array", () => {
      useStore.getState().setInChatSearchQuery("filter-test");
      expect(useStore.getState().inChatSearchQuery).toBe("filter-test");

      useStore.getState().setCurrentChatId("chat-123");

      expect(useStore.getState().currentChatId).toBe("chat-123");
      expect(useStore.getState().inChatSearchQuery).toBe("");
    });
  });

  describe("ChatSlice Purge", () => {
    it("ensures legacy ChatSlice state and methods are completely removed from the store", () => {
      const state = useStore.getState() as unknown as Record<string, unknown>;

      expect(state.chats).toBeUndefined();
      expect(state.pinChat).toBeUndefined();
      expect(state.muteChat).toBeUndefined();
      expect(state.deleteChat).toBeUndefined();
      expect(state.archiveChat).toBeUndefined();
    });
  });
});
