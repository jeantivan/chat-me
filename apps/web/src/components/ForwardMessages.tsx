import { Send, X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { ScrollArea } from "@/components/ui/ScrollArea";

import mc from "@/lib/utils/mergeClassnames";
import {
  useContacts,
  useChats,
  useForwardMessages,
} from "@/lib/api/chatQueries";
import { ContactItem } from "./ContactItem";
import { TMessage, TUser } from "@/lib/types";

type ForwardTarget = {
  id: string;
  targetType: "user" | "chat";
  contactView: TUser;
};

type ForwardMessagesProps = {
  messages: TMessage[];
  open: boolean;
  openChange: (open: boolean) => void;
};

export function ForwardMessages({
  messages,
  open,
  openChange,
}: ForwardMessagesProps) {
  const { data: serverContacts = [] } = useContacts();
  const { data: chatList = [] } = useChats();
  const forwardMessagesMutation = useForwardMessages();

  const [selectedTargets, setSelectedTargets] = useState<ForwardTarget[]>([]);

  const targets: ForwardTarget[] = useMemo(() => {
    const items: ForwardTarget[] = [];

    for (const sc of serverContacts) {
      items.push({
        id: sc.contact.id,
        targetType: "user",
        contactView: {
          id: sc.contact.id,
          name: sc.nickname || sc.contact.name,
          bio: sc.contact.bio || "",
          phone: sc.contact.phone || "",
          picture: sc.contact.pictureUrl || "",
        },
      });
    }

    for (const chat of chatList) {
      if (chat.type === "group") {
        items.push({
          id: chat.id,
          targetType: "chat",
          contactView: {
            id: chat.id,
            name: chat.title || "Grupo",
            bio: chat.bio || "Chat grupal",
            phone: "",
            picture: chat.pictureUrl || "",
          },
        });
      }
    }

    return items;
  }, [serverContacts, chatList]);

  const handleToggleTarget = (target: ForwardTarget) => {
    setSelectedTargets((prev) => {
      const exists = prev.some(
        (t) => t.id === target.id && t.targetType === target.targetType
      );
      if (exists) {
        return prev.filter(
          (t) => !(t.id === target.id && t.targetType === target.targetType)
        );
      }
      return [...prev, target];
    });
  };

  const handleSendForward = async () => {
    const messageIds = messages.map((m) => m.id);
    const targetUserIds = selectedTargets
      .filter((t) => t.targetType === "user")
      .map((t) => t.id);
    const targetChatIds = selectedTargets
      .filter((t) => t.targetType === "chat")
      .map((t) => t.id);

    await forwardMessagesMutation({
      messageIds,
      targetUserIds,
      targetChatIds,
    });
    setSelectedTargets([]);
    openChange(false);
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
          <ScrollArea type="always" className="pr-2.5 flex-1">
            <div className="p-2 grid gap-2 h-full">
              {targets.map((target) => {
                const isSelected = selectedTargets.some(
                  (t) =>
                    t.id === target.id && t.targetType === target.targetType
                );
                return (
                  <div
                    key={`${target.targetType}-${target.id}`}
                    data-testid={`checkbox-contact-${target.id}`}
                    onClick={() => handleToggleTarget(target)}
                  >
                    <ContactItem
                      className="px-4"
                      contact={target.contactView}
                      selectable
                      checked={isSelected}
                      onCheckedChange={() => handleToggleTarget(target)}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          {selectedTargets.length > 0 && (
            <footer className="bg-background-3 min-h-[60px] flex gap-2 items-center justify-between px-4 py-2">
              <div className="text-background-12">
                {selectedTargets.map((target, index) => (
                  <Fragment key={`${target.targetType}-${target.id}`}>
                    <span>{target.contactView.name}</span>
                    {index !== selectedTargets.length - 1 && ", "}
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
                onClick={handleSendForward}
              />
            </footer>
          )}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
