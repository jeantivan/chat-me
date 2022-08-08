import { MessageContent } from "./MessageContent";
import { MessageContainer } from "./MessageContainer";
import { MessageType, ReactionListType } from "../../types";

type MessageProps = MessageType & {
  hasTail: boolean;
  deleteMsg: (id: string) => void;
  favMsg: (id: string) => void;
  addOwnReaction: (id: string, reactionType: ReactionListType) => void;
  changeOwnReaction: (id: string, reactionType: ReactionListType) => void;
  deleteOwnReaction: (id: string) => void;
};
export function Message(props: MessageProps) {
  return (
    <MessageContainer {...props}>
      <MessageContent {...props} />
    </MessageContainer>
  );
}
