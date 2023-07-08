import { MessageContainer } from "./MessageContainer";
import { MessageText } from "./MessageText";
import { MessageMultimedia } from "./MessageMultimedia";
import { memo, useState } from "react";
import { MessageAudio } from "./MessageAudio";
import { MenuRoot } from "@/components/Menu";
import { MessageType, ReactionListType } from "@/lib/types";

type MessageProps = MessageType & {
  hasTail: boolean;
  addOwnReaction: (id: string, reactionType: ReactionListType) => void;
  changeOwnReaction: (id: string, reactionType: ReactionListType) => void;
  deleteOwnReaction: (id: string) => void;
};
export const Message = memo(function MessageRoot(props: MessageProps) {
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
        {props.message.type === "audio" && (
          <MessageAudio {...props} openMenu={openMenu} />
        )}
      </MessageContainer>
    </MenuRoot>
  );
});
