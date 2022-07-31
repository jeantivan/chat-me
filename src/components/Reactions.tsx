import * as PrimitivePopover from "@radix-ui/react-popover";
import cx from "classnames";
import { BsEmojiSmileFill } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";

const reactions = [
  {
    emoji: "👍",
    name: "thumbs-up",
  },
  {
    emoji: "💖",
    name: "heart",
  },
  {
    emoji: "😂",
    name: "face-with-tears-of-joy",
  },
  { emoji: "😮", name: "face-with-open-mouth" },
  { emoji: "😢", name: "crying-face" },
  { emoji: "🙏", name: "folded-hands" },
];

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
  return (
    <PrimitivePopover.Content
      sideOffset={4}
      align="center"
      side="top"
      avoidCollisions={false}
      className={cx(
        "w-46 rounded-full p-2 shadow-md",
        "bg-white dark:bg-slate-800",
        "flex",
        "z-50 select-none"
      )}
    >
      {reactions.map(({ emoji, name }) => (
        <div
          key={name}
          className="w-8 h-8 text-2xl flex justify-center items-baseline mx-1 rounded-full"
        >
          {emoji}
        </div>
      ))}
    </PrimitivePopover.Content>
  );
}
