import dayjs from "dayjs";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Forward, MoreVertical, Smile, Star } from "lucide-react";

import { Menu } from "./Menu";
import { ReactionMenu } from "./ReactionMenu";
import { Reactions } from "./Reactions";
import { Status } from "./Status";

import { IconButton } from "@/components/ui/IconButton";
import mc from "@/lib/utils/mergeClassnames";
import { TMessage } from "@/lib/types";
import useStore from "@/lib/store";

const MessageTail = ({ isOwnMsg }: { isOwnMsg: boolean }) => (
  <span
    aria-hidden={true}
    className={mc(
      "w-3 h-3 absolute top-0 text-primary-8 left-full z-10",
      !isOwnMsg && "text-background-2 left-0 -translate-x-full"
    )}
    style={{ transform: isOwnMsg ? "rotateY(180deg)" : undefined }}
  >
    <svg
      width="12"
      height="12"
      fill="currentColor"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.334232 1.70711C-0.379758 1.07714 0.125918 0 1.13565 0H12V12L0.334232 1.70711Z"
        fill="currentColor"
      />
    </svg>
  </span>
);

const Forwarded = () => (
  <div className="px-2 text-sm text-background-11 flex items-center gap-1">
    <Forward className="w-4 h-4" />
    <span>Reenviado</span>
  </div>
);

const Starred = () => (
  <span className="w-4 h-4 inline-block">
    <Star className="text-background-11 fill-background-11 w-full h-full" />
  </span>
);

type ContainerProps = {
  children: ReactNode;
  hasTail: boolean;
  isOwnMsg: boolean;
  message: TMessage;
};

export function MessageContainer({
  children,
  isOwnMsg,
  hasTail,
  message
}: ContainerProps) {
  const { starred, status, time, reactions, hasMedia, forwarded } = message;
  const [showMenus, setShowMenus] = useState(false);
  const [openMenus, setOpenMenus] = useState(false);
  const userId = useStore((state) => state.user.id);

  const formatTime = dayjs(time).format("HH:mm");
  const ownReaction = reactions?.find((r) => r.owner === userId);

  const stateChange = (open: boolean) => {
    setOpenMenus(open);
  };

  return (
    <div className={mc("mt-1.5", hasTail && "mt-4")}>
      <div
        onMouseEnter={() => {
          setShowMenus(true);
        }}
        onMouseLeave={() => {
          if (openMenus) return;
          setShowMenus(false);
        }}
        className={mc(
          "flex items-center gap-1 justify-end",
          !isOwnMsg && "justify-start"
        )}
      >
        <motion.div
          className={mc(
            "gap-1 flex invisible shrink-0",
            !isOwnMsg && "order-2",
            showMenus && "visible"
          )}
        >
          <Menu
            message={message}
            onOpenChange={stateChange}
            align={isOwnMsg ? "end" : "start"}
          >
            <IconButton
              className="w-7 h-7 p-1"
              icon={MoreVertical}
              label="Abrir menu"
            />
          </Menu>
          <ReactionMenu
            onOpenChange={stateChange}
            ownReaction={ownReaction}
            message={message}
          >
            <IconButton
              label="Reaccionar a este mensaje"
              icon={Smile}
              className="w-7 h-7 p-1"
            />
          </ReactionMenu>
        </motion.div>
        <div
          className={mc(
            "drop-shadow",
            hasMedia ? "max-w-min" : "max-w-8/10 lg:max-w-7/10"
          )}
        >
          <div className="relative">
            {hasTail && <MessageTail isOwnMsg={isOwnMsg} />}
            <div
              className={mc(
                "py-1 rounded-md text-neutral-950 dark:text-neutral-50 bg-primary-8",
                !isOwnMsg && "bg-background-2",
                hasTail
                  ? isOwnMsg
                    ? "rounded-tr-none"
                    : "rounded-tl-none"
                  : undefined
              )}
            >
              {forwarded && <Forwarded />}
              {children}
              <footer className="px-2 flex justify-end items-end gap-1">
                <Reactions reactions={reactions} />
                <div className="flex items-center gap-1">
                  {starred && <Starred />}
                  <span className="leading-none text-sm text-neutral-600 dark:text-neutral-400">
                    {formatTime}
                  </span>
                  {isOwnMsg && <Status status={status} />}
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
