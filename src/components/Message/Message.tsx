import { MessageContainer } from "./MessageContainer";
import { MessageText } from "./MessageText";
import { MessageMultimedia } from "./MessageMultimedia";
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
      {props.message.type === "text" && <MessageText {...props} />}
      {(props.message.type === "video" || props.message.type === "image") && (
        <MessageMultimedia {...props} />
      )}
    </MessageContainer>
  );
}
