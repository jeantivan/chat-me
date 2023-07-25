import { useState } from "react";
import { AnimatePresence, Variants, motion } from "framer-motion";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Smile } from "lucide-react";
import {
  MenuRoot,
  MenuContent,
  MenuTrigger,
  Arrow,
} from "@/components/ui/Menu";
import mc from "@/lib/utils/mergeClassnames";
import { REACTIONS } from "@/lib/utils/constants";
import { ReactionKeys, TMessage, TReaction } from "@/lib/types";
import useStore from "@/lib/store";
import { useUserId } from "@/lib/hooks";

const itemVariants = {
  initial: {
    scale: 0,
  },
  show: {
    scale: 1,
  },
};
const ReactionItem = ({
  className,
  ...rest
}: ToggleGroup.ToggleGroupItemProps) => (
  <motion.div variants={itemVariants}>
    <ToggleGroup.Item
      {...rest}
      className={mc(
        "w-auto h-11 p-2 rounded-full",
        "inline-grid place-items-center",
        "focus-none outline-none cursor-pointer",
        "data-[state=on]:bg-slate-200/80 dark:data-[state=on]:bg-slate-700/80",
        className
      )}
    />
  </motion.div>
);

const contentVariants: Variants = {
  initial: {
    scale: 0,
    y: 30,
  },
  show: {
    scale: 1,
    y: 0,
    transition: {
      type: "tween",
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

type ReactionMenuProps = {
  message: TMessage;
  ownReaction?: TReaction;
  onOpenChange?: (open: boolean) => void;
};
export function ReactionMenu({
  ownReaction,
  message,
  onOpenChange,
}: ReactionMenuProps) {
  const [open, setOpen] = useState(false);
  const userId = useUserId();
  const { addReaction, changeReaction, deleteReaction } = useStore(
    ({ addReaction, changeReaction, deleteReaction }) => ({
      addReaction,
      changeReaction,
      deleteReaction,
    })
  );

  return (
    <MenuRoot
      open={open}
      onOpenChange={(newValue) => {
        setOpen(newValue);
        if (onOpenChange) {
          onOpenChange(newValue);
        }
      }}
    >
      <MenuTrigger icon={Smile} label="Reaccionar" className="w-7 h-7 p-1" />

      <AnimatePresence mode="wait">
        {open && (
          <MenuContent
            forceMount
            asChild
            className="flex-row rounded-full w-auto"
            align="center"
            side="top"
          >
            <motion.div
              variants={contentVariants}
              initial="initial"
              animate="show"
              exit="initial"
            >
              <ToggleGroup.Root
                type="single"
                value={ownReaction?.type}
                onValueChange={(newValue) => {
                  const reaction: TReaction = {
                    owner: userId,
                    type: newValue as TReaction["type"],
                  };

                  if (!ownReaction) {
                    addReaction(message, reaction);
                  } else if (newValue === "") {
                    deleteReaction(message);
                  } else {
                    changeReaction(message, reaction);
                  }

                  setOpen(false);
                }}
                className="flex"
              >
                {(Object.keys(REACTIONS) as ReactionKeys[]).map((reaction) => (
                  <ReactionItem
                    key={REACTIONS[reaction].shortcode}
                    value={REACTIONS[reaction].shortcode}
                  >
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: "10deg" }}
                      className="text-[26px] leading-none"
                    >
                      {REACTIONS[reaction].emoji}
                    </motion.div>
                  </ReactionItem>
                ))}
              </ToggleGroup.Root>
              <Arrow />
            </motion.div>
          </MenuContent>
        )}
      </AnimatePresence>
    </MenuRoot>
  );
}
