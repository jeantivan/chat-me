import * as PrimitivePopover from "@radix-ui/react-popover";
import cx from "classnames";
import { BsEmojiSmileFill } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";
import { ReactionListType } from "../types";

const reactionsList = {
  "thumbs-up": "👍",
  heart: "💖",
  "face-with-tears-of-joy": "😂",
  "face-with-open-mouth": "😮",
  "crying-face": "😢",
  "folded-hands": "🙏",
};

export const ReactionsRoot = PrimitivePopover.Root;

export const ReactionsTrigger = () => (
  <PrimitivePopover.Trigger>
    <button
      className={cx(
        "text-gray-300 dark:text-gray-500",
        "bg-neutral-900/50 dark:bg-neutral-900/80",
        "rounded-full p-1.5 w-8 h-8"
      )}
    >
      <CustomIcon Icon={BsEmojiSmileFill} label="Reaccionar al mensaje" />
    </button>
  </PrimitivePopover.Trigger>
);

export function Reactions() {
  const reactionsArray = Object.keys(reactionsList) as ReactionListType[];
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
      {reactionsArray.map((emoji, i) => (
        <div
          key={emoji}
          className={cx(
            "p-1 w-11 h-11 rounded-full",
            "flex justify-center center"
            // {
            //   "bg-slate-300/20": i === 2,
            // }
          )}
        >
          <span className="text-2xl leading-9">{reactionsList[emoji]}</span>
        </div>
      ))}
    </PrimitivePopover.Content>
  );
}
