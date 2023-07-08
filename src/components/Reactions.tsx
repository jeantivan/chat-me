import * as PrimitivePopover from "@radix-ui/react-popover";
import cx from "classnames";
import { BsEmojiSmileFill } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";

import thumbsUp from "@/assets/reactions-emojis/thumbs-up.svg";
import heart from "@/assets/reactions-emojis/heart.svg";
import faceWithTearsOfJoy from "@/assets/reactions-emojis/face-with-tears-of-joy.svg";
import faceWithOpenMouth from "@/assets/reactions-emojis/face-with-open-mouth.svg";
import cryingFace from "@/assets/reactions-emojis/crying-face.svg";
import foldedHands from "@/assets/reactions-emojis/folded-hands.svg";
import useStore from "@/lib/store";
import { ReactionListType, ReactionType } from "@/lib/types";

const reactionsList = {
  "thumbs-up": thumbsUp,
  heart: heart,
  "face-with-tears-of-joy": faceWithTearsOfJoy,
  "face-with-open-mouth": faceWithOpenMouth,
  "crying-face": cryingFace,
  "folded-hands": foldedHands,
};

export const Reaction = ({ type }: { type: ReactionListType }) => {
  return (
    <span className={cx("w-6 h-6", { "p-0.5": type === "folded-hands" })}>
      <img alt={type} src={reactionsList[type]} />
    </span>
  );
};

export const ReactionsRoot = PrimitivePopover.Root;

export const ReactionsTrigger = () => (
  <PrimitivePopover.Trigger
    className={cx(
      "text-gray-300 dark:text-gray-500",
      "bg-neutral-900/50 dark:bg-neutral-900/80",
      "rounded-full p-1.5 w-8 h-8"
    )}
  >
    <CustomIcon icon={BsEmojiSmileFill} label="Reaccionar al mensaje" />
  </PrimitivePopover.Trigger>
);

export function Reactions({
  ownReaction,
  closeMenu,

  msgId,
}: {
  ownReaction?: ReactionType;
  closeMenu: () => void;
  msgId: string;
}) {
  const reactionsArray = Object.keys(reactionsList) as ReactionListType[];
  const { addReaction, deleteReaction, changeReaction } = useStore((state) => ({
    addReaction: state.addReaction,
    changeReaction: state.changeReaction,
    deleteReaction: state.deleteReaction,
  }));
  const currentChatId = useStore((state) => state.currentChatId);

  const reactToMsg = (reactionType: ReactionListType) => {
    if (!ownReaction) {
      addReaction(msgId, reactionType, currentChatId!);
    } else if (ownReaction.reaction.type === reactionType) {
      deleteReaction(msgId, currentChatId!);
    } else {
      changeReaction(msgId, reactionType, currentChatId!);
    }

    closeMenu();
  };
  return (
    <PrimitivePopover.Content
      sideOffset={4}
      align="center"
      side="top"
      avoidCollisions={false}
      className={cx(
        "w-46 rounded-full p-1.5 shadow-md",
        "bg-white dark:bg-slate-800",
        "flex",
        "z-50 select-none"
      )}
    >
      {reactionsArray.map((reaction, i) => (
        <button
          key={reaction}
          className={cx(
            "p-1 w-11 h-11 rounded-full",
            "flex justify-center center",
            "active:bg-gray-400/40",
            { "bg-gray-400/40": ownReaction?.reaction.type === reaction }
          )}
          onClick={() => {
            reactToMsg(reaction);
          }}
        >
          <span
            className={cx("w-10 h-10", { "p-1": reaction === "folded-hands" })}
          >
            <img
              className="w-full h-full"
              alt={reaction}
              src={reactionsList[reaction]}
            />
          </span>
        </button>
      ))}
    </PrimitivePopover.Content>
  );
}
