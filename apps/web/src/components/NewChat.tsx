import { useMemo } from "react";
import map from "lodash/map";
import groupBy from "lodash/groupBy";
import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";

import { ScrollArea } from "./ui/ScrollArea";
import { ContactItem } from "./ContactItem";

import useStore from "@/lib/store";
import { useContacts } from "@/lib/api/chatQueries";
import { getAuthHeaders } from "@/lib/auth/authClient";
import { chatKeys } from "@/lib/socket/useSocketSync";
import { router } from "@/routes/router";
import { TUser } from "@/lib/types";

export function NewChat() {
  const queryClient = useQueryClient();
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  const { data: serverContacts } = useContacts();

  const allContacts: TUser[] = useMemo(() => {
    if (serverContacts) {
      return serverContacts.map((sc) => ({
        id: sc.contact.id,
        name: sc.nickname || sc.contact.name,
        bio: sc.contact.bio,
        phone: sc.contact.phone || "",
        picture: sc.contact.pictureUrl,
      }));
    }
    return [];
  }, [serverContacts]);

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
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
        setCurrentChatId(chatSummary.id);
        closeLeftDrawer();
        router.navigate({ to: "/c/$chatId", params: { chatId: chatSummary.id } });
        return;
      }
    } catch {
      // Failed to create chat via API
    }
  };

  return (
    <ScrollArea type="auto">
      <div className="py-4 px-2 text-background-12 grid gap-4">
        <button
          onClick={() => {
            leftDrawerGoTo("NEW_GROUP");
          }}
          className="flex items-center gap-4 p-3 rounded-xl hover:bg-background-4 transition-colors text-left"
        >
          <div className="w-12 h-12 rounded-full bg-primary-9 text-white flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="font-medium text-base text-background-12">
              Nuevo grupo
            </div>
            <div className="text-xs text-background-11">
              Crea un grupo con múltiples contactos
            </div>
          </div>
        </button>

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
