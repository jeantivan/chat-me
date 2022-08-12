import { MessageContainer } from "./MessageContainer";
import { MessageText } from "./MessageText";
import { MessageMultimedia } from "./MessageMultimedia";
import { MessageType, ReactionListType } from "../../types";
import { useState } from "react";
import { MenuRoot } from "../Menu";

type MessageProps = MessageType & {
  hasTail: boolean;
  deleteMsg: (id: string) => void;
  favMsg: (id: string) => void;
  addOwnReaction: (id: string, reactionType: ReactionListType) => void;
  changeOwnReaction: (id: string, reactionType: ReactionListType) => void;
  deleteOwnReaction: (id: string) => void;
};
export function Message(props: MessageProps) {
  const [openMenu, setOpenMenu] = useState(false);
  return (
    <MenuRoot open={openMenu} onOpenChange={setOpenMenu}>
      <MessageContainer {...props}>
        {props.message.type === "text" && (
          <MessageText {...props} openMenu={openMenu} />
        )}
        {(props.message.type === "video" || props.message.type === "image") && (
          <MessageMultimedia {...props} openMenu={openMenu} />
        )}
      </MessageContainer>
    </MenuRoot>
  );
}
