import { MessageContent } from "./MessageContent";
import { MessageContainer } from "./MessageContainer";
import { MessageType } from "../../types";

interface MessageProps {
  hasTail: boolean;
  message: MessageType;
  deleteMsg: (id: string) => void;
}
export function Message({ message, hasTail, deleteMsg }: MessageProps) {
  return (
    <MessageContainer
      hasTail={hasTail}
      isOwnMsg={message.isOwnMsg}
      msgId={message.id}
      deleteMsg={deleteMsg}
    >
      <MessageContent {...message} />
    </MessageContainer>
  );
}
