import { Send, X } from "lucide-react";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogClose
} from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { ScrollArea } from "@/components/ui/ScrollArea";

import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
import { ContactItem } from "./ContactItem";
import { TMessage, TUser } from "@/lib/types";
import { Fragment, useState } from "react";

type ForwardMessagesProps = {
  messages: TMessage[];
  open: boolean;
  openChange: (open: boolean) => void;
};
export function ForwardMessages({
  messages,
  open,
  openChange
}: ForwardMessagesProps) {
  const forwardMessages = useStore((state) => state.forwardMessages);
  const contacts = useStore((state) => state.contacts);

  const [contactsToForward, setContactsToForward] = useState<TUser[]>([]);

  const handleCheckedChange = (contact: TUser) => {
    const index = contactsToForward.findIndex((c) => c.id === contact.id);

    if (index < 0) {
      setContactsToForward([...contactsToForward, contact]);
    } else {
      setContactsToForward(
        contactsToForward.filter((c) => c.id !== contact.id)
      );
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={openChange}>
      <DialogContent scroll={false} open={open} className="py-6">
        <div
          className={mc(
            "w-[40%] h-full rounded-lg",
            "bg-background-2 text-background-12 shadow-xl",
            "flex flex-col"
          )}
        >
          <header className="px-4 py-2 flex items-center gap-4 bg-background-3">
            <DialogClose asChild>
              <IconButton icon={X} label="Cerrar ventana" />
            </DialogClose>
            <DialogTitle className="text-lg text-background-12">
              Reenviar mensaje a:
            </DialogTitle>
          </header>
          <ScrollArea type="always" className="pr-2.5">
            <div className="p-2 grid gap-2 h-full">
              {contacts.map((contact) => (
                <ContactItem
                  className="px-4"
                  key={contact.id}
                  contact={contact}
                  selectable
                  checked={Boolean(
                    contactsToForward.find((c) => c.id === contact.id)
                  )}
                  onCheckedChange={() => {
                    handleCheckedChange(contact);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
          {contactsToForward.length > 0 && (
            <footer className="bg-background-3 min-h-[60px] flex gap-2 items-center justify-between px-4 py-2">
              <div className="text-background-12">
                {contactsToForward.map((contact, index) => (
                  <Fragment key={contact.id}>
                    <span>{contact.name}</span>
                    {index !== contactsToForward.length - 1 && ", "}
                  </Fragment>
                ))}
              </div>
              <IconButton
                icon={Send}
                label="Enviar mensajes"
                iconClassName="rotate-45"
                className={mc(
                  "w-11 h-11 shrink-0",
                  "bg-primary-9 hover:bg-primary-10 text-primary-12",
                  "[&_span]:-ml-1.5"
                )}
                onClick={() => {
                  forwardMessages(messages, contactsToForward);
                  openChange(false);
                }}
              />
            </footer>
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
