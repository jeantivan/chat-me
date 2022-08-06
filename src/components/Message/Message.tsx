import { MessageContent } from "./MessageContent";
import { MessageContainer } from "./MessageContainer";
import { MessageType } from "../../types";

interface MessageProps {
  hasTail: boolean;
  message: MessageType;
  deleteMsg: (id: string) => void;
  favMsg: (id: string) => void;
}
export function Message({ message, hasTail, deleteMsg, favMsg }: MessageProps) {
  return (
    <MessageContainer
      hasTail={hasTail}
      isOwnMsg={message.isOwnMsg}
      isFavMsg={message.isFavMsg}
      msgId={message.id}
      deleteMsg={deleteMsg}
      favMsg={favMsg}
    >
      <MessageContent {...message} />
    </MessageContainer>
  );
}
