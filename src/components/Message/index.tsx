import { memo } from "react";
import { MessageContainer } from "./MessageContainer";
import { MessageText } from "./MessageText";
import { ImageAndVideo } from "./ImageAndVideo";
import { TMessage } from "@/lib/types";

type MessageProps = {
  isOwnMsg: boolean;
  hasTail: boolean;
  message: TMessage;
};
export const Message = memo(function MessageRoot(props: MessageProps) {
  const { body, hasMedia } = props.message;

  return (
    <MessageContainer {...props}>
      {hasMedia && <ImageAndVideo {...hasMedia} />}
      {body && <MessageText content={body} />}
    </MessageContainer>
  );
});
