import map from "lodash/map";
import groupBy from "lodash/groupBy";

import { ScrollArea } from "./ui/ScrollArea";
import { ContactItem } from "./ContactItem";

import useStore from "@/lib/store";

export function NewChat() {
  const allChats = useStore((state) => state.chats);
  const allContacts = useStore((state) => state.contacts);
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);

  const contactGroupByFirstLetter = map(
    groupBy(allContacts, "name[0]"),
    (contacts, letter) => ({
      letter,
      contacts
    })
  );

  const openChat = (contactId: string) => {
    const chat = allChats.find((c) => c.participants[0].id === contactId);

    if (!chat) return;

    setCurrentChatId(chat.id);
    closeLeftDrawer();
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
