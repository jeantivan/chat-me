import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import cx from "classnames";
import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { BsChevronDown, BsEmojiSmileFill } from "react-icons/bs";
import { MenuTrigger, MenuRoot, MenuItem, MenuContent } from "./Menu";
import { CustomIcon } from "./CustomIcon";
import { MessageType } from "../types";

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

const buttonVariants = {
  hidden: { opacity: 0, transition: { duration: 0.05 } },
  show: { opacity: 1, transition: { duration: 0.05 } },
};

const MessageTail = ({ isOwnMsg }: { isOwnMsg: boolean }) => (
  <span
    aria-hidden={true}
    className={cx(
      "w-3 h-3 absolute top-0",
      {
        "dark:bg-emerald-700 bg-green-200": isOwnMsg,
        "dark:bg-slate-700 bg-white": !isOwnMsg,
      },
      { "left-full": isOwnMsg, "left-0": !isOwnMsg }
    )}
    style={{
      zIndex: "-1",
      transform: isOwnMsg
        ? "translate3d(-2%, 0, -10px)"
        : "translate3d(-98%, 0, -10px)",
      borderRadius: isOwnMsg
        ? "95% 5% 100% 0% / 0% 5% 95% 100%"
        : "5% 95% 0% 100% / 5% 0% 100% 95%",
    }}
  />
);

const ReactionRoot: React.FC<PopoverPrimitive.PopoverProps> = ({
  children,
  ...rest
}) => <PopoverPrimitive.Root {...rest}>{children}</PopoverPrimitive.Root>;

type MessageProps = { isFirstMessage: boolean } & MessageType;

export function Message({
  message,
  status,
  isOwnMsg,
  time,
  isFirstMessage,
}: MessageProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openReactions, setOpenReactions] = useState(false);
  const controls = useAnimation();

  return (
    <motion.div
      onHoverStart={() => {
        controls.start("show");
      }}
      onHoverEnd={() => {
        if (openReactions) return;

        controls.start("hidden");
      }}
      className={cx("px-5 md:px-[5%] lg:px-[9%]", {
        "mt-4": isFirstMessage,
        "mt-1": !isFirstMessage,
      })}
    >
      <div
        className={cx("w-full flex", {
          "justify-start": !isOwnMsg,
          "justify-end": isOwnMsg,
        })}
      >
        <MenuRoot open={openMenu} onOpenChange={setOpenMenu}>
          <div className="w-11/12 md:w-4/5  lg:w-3/4 drop-shadow">
            <div
              className={cx(
                "overflow-hidden p-2 flex flex-wrap drop-shadow group",
                {
                  "dark:bg-emerald-700 bg-green-200": isOwnMsg,
                  "dark:bg-slate-700 bg-white": !isOwnMsg,
                },
                { "rounded-b": isFirstMessage, rounded: !isFirstMessage },
                { "rounded-tl": isOwnMsg, "rounded-tr": !isOwnMsg }
              )}
            >
              <p className="text-base dark:text-white leading-tight text-clip">
                {message.content}
              </p>
              <span className="text-xs dark:text-gray-400 text-neutral-500 ml-auto self-end pt-1 pl-1">
                {time}
              </span>
              <MenuTrigger asChild>
                <button
                  className={cx(
                    "transition opacity-0 translate-x-full group-hover:-translate-x-0 group-hover:opacity-100",
                    { "-translate-x-0 opacity-100": openMenu },
                    "text-lg text-gray-400",
                    "px-2 py-1 fixed top-0 right-0",
                    "bg-gradient-to-bl",
                    {
                      "dark:from-emerald-700 dark:via-emerald-700 via-green-200 from-green-200":
                        isOwnMsg,
                      "dark:from-slate-700 dark:via-slate-700 via-white from-white":
                        !isOwnMsg,
                    }
                  )}
                >
                  <CustomIcon Icon={BsChevronDown} label="Mostrar menu" />
                </button>
              </MenuTrigger>
            </div>
            {isFirstMessage && <MessageTail isOwnMsg={isOwnMsg} />}
          </div>
          <MenuContent align={isOwnMsg ? "end" : "start"} className="w-48">
            <MenuItem>Responder</MenuItem>
            <MenuItem>Reaccionar al Mensaje</MenuItem>
            <MenuItem>Reenviar mensaje</MenuItem>
            <MenuItem>Destacar mensaje</MenuItem>
            <MenuItem>Eliminar mensaje</MenuItem>
          </MenuContent>
        </MenuRoot>

        <ReactionRoot open={openReactions} onOpenChange={setOpenReactions}>
          <div
            className={cx("mx-4 flex items-center flex-1", {
              "order-first": isOwnMsg,
              "justify-end": isOwnMsg,
            })}
          >
            <motion.div
              initial="hidden"
              variants={buttonVariants}
              animate={controls}
            >
              <PopoverPrimitive.Trigger asChild>
                <button
                  className={cx(
                    "text-gray-300 dark:text-gray-500 bg-neutral-900/50 dark:bg-neutral-900/80",
                    "rounded-full p-1.5 w-9 h-9"
                  )}
                >
                  <CustomIcon
                    Icon={BsEmojiSmileFill}
                    label="Reaccionar al mensaje"
                  />
                </button>
              </PopoverPrimitive.Trigger>
            </motion.div>

            <PopoverPrimitive.Content
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
            </PopoverPrimitive.Content>
          </div>
        </ReactionRoot>
      </div>
    </motion.div>
  );
}
