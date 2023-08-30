import dayjs from "dayjs";
import { useState } from "react";
import { useElementSize } from "usehooks-ts";
import { X, Smile, Star, Forward } from "lucide-react";

import { ForwardMessages } from "./ForwardMessages";
import { ReactionMenu } from "./Message/ReactionMenu";
import { Reactions } from "./Message/Reactions";

import { DialogRoot, DialogClose, DialogContent } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
import { TMessage } from "@/lib/types";
import { MessageText } from "./Message/MessageText";

const dimensions: Record<"square" | "landscape" | "portrait", string> = {
  square: "aspect-[1]",
  landscape: "aspect-video",
  portrait: "aspect-[0.75]"
};

export function MediaMessageDialog({
  mediaMessage
}: {
  mediaMessage: TMessage;
}) {
  const [containerRef, { width, height }] = useElementSize();
  const [forwardMessagesDialog, setForwardMessagesDialog] = useState(false);
  const closeMediaMessage = useStore((state) => state.closeMediaMessage);
  const starMessage = useStore((state) => state.starMessage);
  const message = useStore((state) => {
    const chatIndex = state.chats.findIndex(
      (chat) => chat.id === mediaMessage.chatId
    );

    if (chatIndex < 0) return null;

    return (
      state.chats[chatIndex].messages.find(
        (msg) => msg.id === mediaMessage.id
      ) || null
    );
  });

  if (!message) return null;

  const formatTime = dayjs(message?.time).format("DD/MM/YYYY [a la(s)] HH:mm");

  const user = useStore((state) => state.user);

  const owner = useStore((state) => {
    return state.contacts.find((c) => c.id === message.owner) || state.user;
  });

  const isOwnMsg = user.id === owner?.id;
  const ownReaction = message.reactions?.find((r) => r.owner === user.id);

  return (
    <DialogRoot>
      <DialogContent
        open={Boolean(message)}
        overlayClassName="bg-background-6/70"
      >
        <div className="w-full h-screen grid grid-rows-[min-content_1fr_minmax(56px,_min-content)] gap-4 place-items-center py-4">
          <header className="w-full flex justify-between px-6">
            <div className="flex gap-4">
              <img
                className="w-12 h-12 rounded-full bg-background-10"
                src={owner?.picture}
                loading="lazy"
                alt={owner?.name}
              />
              <div className="text-background-12">
                <div>{owner?.name}</div>
                <div className="text-sm text-background-11">{formatTime}</div>
              </div>
            </div>
            <div className="flex items items-center gap-3">
              <IconButton
                onClick={() => {
                  setForwardMessagesDialog(true);
                }}
                label="Reenviar mensaje"
                icon={Forward}
              />
              <IconButton
                label="Destacar mensaje"
                icon={Star}
                iconClassName={
                  message.starred ? "fill-background-12" : undefined
                }
                onClick={() => {
                  starMessage(message);
                }}
              />
              <ReactionMenu ownReaction={ownReaction} message={message}>
                <IconButton label="Reaccionar a este mensaje" icon={Smile} />
              </ReactionMenu>
              <DialogClose asChild>
                <IconButton
                  onClick={closeMediaMessage}
                  label="Cerrar imagen"
                  icon={X}
                />
              </DialogClose>
            </div>
          </header>
          <section className="w-full h-full max-h-full flex justify-center px-6 select-none">
            <div
              ref={containerRef}
              className={mc(
                "bg-neutral-500 h-full max-w-[80%] relative",
                message?.hasMedia && dimensions[message.hasMedia.orientation]
              )}
            >
              <img
                src={message?.hasMedia?.src}
                alt={`Foto enviada por ${owner?.name}`}
                style={{ width, height }}
              />
              <Reactions
                reactions={message.reactions}
                className="absolute right-5 -translate-y-1/2"
              />
            </div>
          </section>
          <div className="mx-auto max-w-[60%]">
            {message?.body && (
              <div
                className={mc(
                  "w-auto p-2 rounded text-neutral-950 dark:text-neutral-50 bg-primary-8",
                  !isOwnMsg && "bg-background-2"
                )}
              >
                <MessageText body={message.body} className="line-clamp-4" />
              </div>
            )}
          </div>
        </div>
        <ForwardMessages
          messages={[message]}
          open={forwardMessagesDialog}
          openChange={setForwardMessagesDialog}
        />
      </DialogContent>
    </DialogRoot>
  );
}
