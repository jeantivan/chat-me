import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
import { DialogRoot, DialogClose, DialogContent } from "@/components/ui/Dialog";
import dayjs from "dayjs";
import { IconButton } from "./ui/IconButton";
import { X } from "lucide-react";
import { TMessage } from "@/lib/types";
import { useElementSize } from "usehooks-ts";
import { ReactionMenu } from "./Message/ReactionMenu";
import { Smile } from "lucide-react";
import { REACTIONS } from "@/lib/utils/constants";
const dimensions: Record<"square" | "landscape" | "portrait", string> = {
  square: "aspect-[1]",
  landscape: "aspect-video",
  portrait: "aspect-[0.75]",
};

export function MediaMessage({ mediaMessage }: { mediaMessage: TMessage }) {
  const [containerRef, { width, height }] = useElementSize();
  const closeMediaMessage = useStore((state) => state.closeMediaMessage);
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
              {message.reactions.length > 0 && (
                <div className="select-none mr-auto flex gap-0.5 absolute right-5 -translate-y-1/2">
                  {message.reactions.map(({ owner, type }) => (
                    <div
                      key={owner}
                      className="p-1 rounded-full bg-background-10 text-[18px] leading-none text-center"
                    >
                      {REACTIONS[type].emoji}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          <div className="mx-auto max-w-[80%]">
            {message?.body && (
              <div
                className={mc(
                  "w-auto px-4 py-2 rounded text-neutral-950 dark:text-neutral-50 bg-primary-8",
                  !isOwnMsg && "bg-background-2"
                )}
              >
                <div className="whitespace-pre-wrap break-words leading-tight line-clamp-4">
                  {message.body}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
