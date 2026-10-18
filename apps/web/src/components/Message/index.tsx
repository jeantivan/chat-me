import { memo } from "react";
import { MessageContainer } from "./MessageContainer";
import { MessageText } from "./MessageText";
import { ImageAndVideo } from "./ImageAndVideo";
import { TMessage } from "@/lib/types";
import useStore from "@/lib/store";

type MessageProps = {
  isOwnMsg: boolean;
  hasTail: boolean;
  message: TMessage;
};
export const Message = memo(function MessageRoot(props: MessageProps) {
  const { body, hasMedia } = props.message;
  const openMediaMessage = useStore((state) => state.openMediaMessage);

  return (
    <MessageContainer {...props}>
      {hasMedia && (
        <ImageAndVideo
          {...hasMedia}
          onClick={() => {
            openMediaMessage(props.message);
          }}
        />
      )}
      {body && <MessageText body={body} />}
    </MessageContainer>
  );
});
