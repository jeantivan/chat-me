import { useMemo } from "react";
import map from "lodash/map";
import groupBy from "lodash/groupBy";

import { ScrollArea } from "./ui/ScrollArea";
import { ContactItem } from "./ContactItem";

import useStore from "@/lib/store";
import { useContacts } from "@/lib/api/chatQueries";
import { getAuthHeaders } from "@/lib/auth/authClient";
import { router } from "@/routes/router";
import { TUser } from "@/lib/types";

export function NewChat() {
  const allChats = useStore((state) => state.chats);
  const storeContacts = useStore((state) => state.contacts);
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  const { data: serverContacts } = useContacts();

  const allContacts: TUser[] = useMemo(() => {
    if (serverContacts && serverContacts.length > 0) {
      return serverContacts.map((sc) => ({
        id: sc.contact.id,
        name: sc.nickname || sc.contact.name,
        bio: sc.contact.bio,
        phone: sc.contact.phone || "",
        picture: sc.contact.pictureUrl,
      }));
    }
    return storeContacts;
  }, [serverContacts, storeContacts]);

  const contactGroupByFirstLetter = map(
    groupBy(allContacts, "name[0]"),
    (contacts, letter) => ({
      letter,
      contacts
    })
  );

  const openChat = async (contactId: string) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${apiBase}/api/v1/chats/direct`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ targetUserId: contactId }),
      });
      if (res.ok) {
        const chatSummary = await res.json();
        setCurrentChatId(chatSummary.id);
        closeLeftDrawer();
        router.navigate({ to: "/c/$chatId", params: { chatId: chatSummary.id } });
        return;
      }
    } catch {
      // Fallback to local store search
    }

    const chat = allChats.find((c) => c.participants[0].id === contactId);
    if (!chat) return;

    setCurrentChatId(chat.id);
    closeLeftDrawer();
    router.navigate({ to: "/c/$chatId", params: { chatId: chat.id } });
  };

  return (
    <ScrollArea type="auto">
      <div className="py-4 px-2 text-background-12 grid gap-4">
        {contactGroupByFirstLetter.map(({ letter, contacts }) => {
          return (
            <div key={letter} className="grid gap-2">
              <div className="text-primary-9 border-b border-primary-3 pb-2 pl-3">
                {letter}
              </div>
              {contacts.map((contact) => (
                <div
                  key={contact.phone}
                  onClick={() => {
                    openChat(contact.id);
                  }}
                >
                  <ContactItem contact={contact} selectable={false} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
