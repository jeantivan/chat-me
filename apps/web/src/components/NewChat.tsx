import { useMemo, useState } from "react";
import map from "lodash/map";
import groupBy from "lodash/groupBy";
import { useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Loader2 } from "lucide-react";

import { ScrollArea } from "./ui/ScrollArea";
import { ContactItem } from "./ContactItem";

import useStore from "@/lib/store";
import { useContacts, useAddContact } from "@/lib/api/chatQueries";
import { getAuthHeaders } from "@/lib/auth/authClient";
import { chatKeys } from "@/lib/socket/useSocketSync";
import { router } from "@/routes/router";
import { TUser } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

export function NewChat() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  const { data: serverContacts } = useContacts();
  const addContactMutation = useAddContact();

  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setFeedback(null);

    try {
      await addContactMutation.mutateAsync({ email: trimmedEmail });
      setFeedback({
        type: "success",
        message: t("drawer.contactAddedSuccess"),
      });
      setEmail("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || t("drawer.contactAddError"),
      });
    }
  };

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
              {t("drawer.newGroup")}
            </div>
            <div className="text-xs text-background-11">
              {t("drawer.createGroupDesc")}
            </div>
          </div>
        </button>

        <form
          onSubmit={handleAddContact}
          className="p-3 bg-background-3 rounded-xl flex flex-col gap-2"
        >
          <label className="text-xs font-medium text-background-11 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-primary-9" />
            {t("drawer.addContactByEmail")}
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (feedback) setFeedback(null);
              }}
              placeholder={t("drawer.emailPlaceholder")}
              className="flex-1 min-w-0 bg-background-2 border border-background-6 rounded-lg px-3 py-1.5 text-sm text-background-12 placeholder:text-background-8 focus:outline-none focus:border-primary-8"
              disabled={addContactMutation.isPending}
            />
            <button
              type="submit"
              disabled={addContactMutation.isPending || !email.trim()}
              className="px-3 py-1.5 bg-primary-9 hover:bg-primary-10 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center shrink-0 min-w-[60px]"
            >
              {addContactMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("drawer.addContactButton")
              )}
            </button>
          </div>
          {feedback && (
            <div
              className={`text-xs px-2.5 py-1.5 rounded-md ${
                feedback.type === "success"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {feedback.message}
            </div>
          )}
        </form>

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
