import dayjs from "dayjs";
import { useState } from "react";
import { useElementSize } from "usehooks-ts";
import { X, Smile, Star, Forward, ZoomIn, ZoomOut } from "lucide-react";

import { ForwardMessages } from "./ForwardMessages";
import { ReactionMenu } from "./Message/ReactionMenu";
import { Reactions } from "./Message/Reactions";

import { DialogRoot, DialogClose, DialogContent } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
import { useContacts, useToggleStarMessage } from "@/lib/api/chatQueries";
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
  const [zoom, setZoom] = useState(1);
  const [isStarred, setIsStarred] = useState(Boolean(mediaMessage?.starred));

  const closeMediaMessage = useStore((state) => state.closeMediaMessage);
  const toggleStarServer = useToggleStarMessage();

  const message = mediaMessage;
  const user = useStore((state) => state.user);
  const { data: contacts = [] } = useContacts();

  const contactEntry = contacts?.find(
    (c) => c.contact?.id === message.owner || c.contactUserId === message.owner
  );
  const isOwnMsg = user.id === message.owner;
  const ownerName = isOwnMsg
    ? user.name
    : contactEntry?.contact?.name || message.senderName || "Usuario";
  const ownerPicture = isOwnMsg
    ? user.picture
    : contactEntry?.contact?.pictureUrl || message.senderPicture || "";

  if (!message) return null;

  const formatTime = dayjs(message?.time).format("DD/MM/YYYY [a la(s)] HH:mm");
  const ownReaction = message.reactions?.find((r) => r.owner === user.id);

  const handleZoomIn = () => setZoom((prev) => Math.min(3, +(prev + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

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
                className="w-12 h-12 rounded-full bg-background-10 object-cover"
                src={ownerPicture}
                loading="lazy"
                alt={ownerName}
              />
              <div className="text-background-12">
                <div>{ownerName}</div>
                <div className="text-sm text-background-11">{formatTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-background-5/50 rounded-lg px-2 py-1">
                <IconButton
                  onClick={handleZoomOut}
                  label="Alejar (Zoom Out)"
                  icon={ZoomOut}
                  disabled={zoom <= 0.5}
                />
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="text-xs text-background-12 font-medium px-1.5 py-0.5 rounded hover:bg-background-6 transition-colors select-none"
                  title="Restablecer zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <IconButton
                  onClick={handleZoomIn}
                  label="Acercar (Zoom In)"
                  icon={ZoomIn}
                  disabled={zoom >= 3}
                />
              </div>

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
                  isStarred ? "fill-background-12" : undefined
                }
                onClick={() => {
                  setIsStarred((prev) => !prev);
                  toggleStarServer(message.id, message.chatId);
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

          <section className="w-full h-full max-h-full flex justify-center px-6 select-none overflow-hidden">
            <div
              ref={containerRef}
              className={mc(
                "bg-neutral-500 h-full max-w-[80%] relative overflow-hidden flex items-center justify-center",
                message?.hasMedia && dimensions[message.hasMedia.orientation]
              )}
            >
              {message?.hasMedia?.type === "video" ? (
                <video
                  src={message.hasMedia.src}
                  controls
                  autoPlay
                  style={{
                    width,
                    height,
                    transform: `scale(${zoom})`,
                    transition: "transform 150ms ease-out",
                  }}
                  className="object-contain"
                />
              ) : (
                <img
                  src={message?.hasMedia?.src}
                  alt={`Foto enviada por ${ownerName}`}
                  style={{
                    width,
                    height,
                    transform: `scale(${zoom})`,
                    transition: "transform 150ms ease-out",
                  }}
                  className="object-contain"
                />
              )}
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
