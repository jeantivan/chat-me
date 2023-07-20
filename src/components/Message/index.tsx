import { memo } from "react";
import { MessageContainer } from "./MessageContainer";
import { MessageText } from "./MessageText";
import { ImageAndVideo } from "./ImageAndVideo";
import { TMessage } from "@/lib/types";

type MessageProps = TMessage & {
  isOwnMsg: boolean;
  hasTail: boolean;
};
export const Message = memo(function MessageRoot(props: MessageProps) {
  const { body, hasMedia } = props;

  return (
    <MessageContainer {...props}>
      {hasMedia && <ImageAndVideo {...hasMedia} />}
      {body && <MessageText content={body} />}
    </MessageContainer>
  );
});
