import { useState, useMemo } from "react";
import map from "lodash/map";
import groupBy from "lodash/groupBy";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Check } from "lucide-react";

import { ScrollArea } from "./ui/ScrollArea";
import { ContactItem } from "./ContactItem";

import useStore from "@/lib/store";
import { useContacts } from "@/lib/api/chatQueries";
import { getAuthHeaders } from "@/lib/auth/authClient";
import { chatKeys } from "@/lib/socket/useSocketSync";
import { router } from "@/routes/router";
import { TUser } from "@/lib/types";

export function NewGroup() {
  const queryClient = useQueryClient();
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  const { data: serverContacts } = useContacts();

  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      contacts,
    })
  );

  const toggleContact = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = async () => {
    if (!title.trim() || selectedIds.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${apiBase}/api/v1/chats`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "group",
          title: title.trim(),
          participantIds: selectedIds,
        }),
      });

      if (res.ok) {
        const chatSummary = await res.json();
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
        setCurrentChatId(chatSummary.id);
        closeLeftDrawer();
        router.navigate({ to: "/c/$chatId", params: { chatId: chatSummary.id } });
      }
    } catch {
      // Handle error gracefully
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-5">
      {/* Title input & creation action */}
      <div className="p-4 bg-background-3 border-b border-background-7 grid gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-3 flex items-center justify-center text-primary-9 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <input
            data-testid="group-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre del grupo..."
            className="flex-1 bg-background-1 text-background-12 border border-background-7 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-9"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-background-11">
            {selectedIds.length}{" "}
            {selectedIds.length === 1 ? "contacto seleccionado" : "contactos seleccionados"}
          </span>
          <button
            data-testid="create-group-button"
            role="button"
            onClick={handleCreateGroup}
            disabled={!title.trim() || selectedIds.length === 0 || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-9 text-white text-sm font-medium rounded-lg hover:bg-primary-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            Crear grupo
          </button>
        </div>
      </div>

      {/* Selectable contact list */}
      <ScrollArea type="auto" className="flex-1">
        <div className="py-4 px-2 text-background-12 grid gap-4">
          {contactGroupByFirstLetter.map(({ letter, contacts }) => (
            <div key={letter} className="grid gap-2">
              <div className="text-primary-9 border-b border-primary-3 pb-2 pl-3">
                {letter}
              </div>
              {contacts.map((contact) => {
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    data-testid={`checkbox-contact-${contact.id}`}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <ContactItem
                      contact={contact}
                      selectable={true}
                      checked={isSelected}
                      onCheckedChange={() => toggleContact(contact.id)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
