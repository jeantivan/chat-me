import { memo } from "react";
import { MessageContainer } from "./MessageContainer";
import { MessageText } from "./MessageText";
import { ImageAndVideo } from "./ImageAndVideo";
import { AudioAttachment } from "./AudioAttachment";
import { DocumentAttachment } from "./DocumentAttachment";
import { TMessage } from "@/lib/types";
import useStore from "@/lib/store";
import { DELETED_MESSAGE_TOMBSTONE } from "@chat-me/shared";

type MessageProps = {
  isOwnMsg: boolean;
  hasTail: boolean;
  message: TMessage;
  senderName?: string;
};
export const Message = memo(function MessageRoot(props: MessageProps) {
  const { body, deleted, hasMedia } = props.message;
  const isDeleted = Boolean(deleted) || body === DELETED_MESSAGE_TOMBSTONE;
  const openMediaMessage = useStore((state) => state.openMediaMessage);

  return (
    <MessageContainer {...props}>
      {hasMedia && !isDeleted && (
        <>
          {(hasMedia.type === "image" || hasMedia.type === "video") && (
            <ImageAndVideo
              {...hasMedia}
              onClick={() => {
                openMediaMessage(props.message);
              }}
            />
          )}
          {hasMedia.type === "audio" && (
            <AudioAttachment media={hasMedia} />
          )}
          {hasMedia.type === "document" && (
            <DocumentAttachment media={hasMedia} />
          )}
        </>
      )}
      {(body || isDeleted) && <MessageText body={body} deleted={deleted} />}
    </MessageContainer>
  );
});
