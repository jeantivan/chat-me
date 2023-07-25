import dayjs from "dayjs";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Menu } from "./Menu";
import { ReactionMenu } from "./ReactionMenu";
import { Status } from "./Status";

import mc from "@/lib/utils/mergeClassnames";
import { REACTIONS } from "@/lib/utils/constants";
import { TMessage } from "@/lib/types";
import useStore from "@/lib/store";

const MessageTail = ({ isOwnMsg }: { isOwnMsg: boolean }) => (
  <span
    aria-hidden={true}
    className={mc(
      "w-3 h-3 absolute top-0 dark:text-emerald-700 text-green-200 left-full z-10",
      !isOwnMsg && "dark:text-slate-700 text-white left-0 -translate-x-full"
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
  message,
}: ContainerProps) {
  const { starred, status, time, reactions, hasMedia } = message;
  const [showMenus, setShowMenus] = useState(false);
  const [openMenus, setOpenMenus] = useState(false);
  const userId = useStore((state) => state.user.id);

  const formatTime = dayjs(time).format("HH:mm");
  const ownReaction = reactions?.find((r) => r.owner === userId);

  const stateChange = (open: boolean) => {
    setOpenMenus(open);
  };

  return (
    <div className={mc("ml-[76px] mr-[70px] mt-1.5", hasTail && "mt-4")}>
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
          />
          <ReactionMenu
            onOpenChange={stateChange}
            ownReaction={ownReaction}
            message={message}
          />
        </motion.div>
        <div
          className={mc(
            "drop-shadow",
            hasMedia ? "max-w-min" : "max-w-8/10 lg:max-w-7/10"
          )}
        >
          <div className={mc("relative")}>
            {hasTail && <MessageTail isOwnMsg={isOwnMsg} />}
            <div
              className={mc(
                "py-1 rounded-md dark:bg-emerald-700 bg-green-200",
                !isOwnMsg && "dark:bg-slate-700 bg-white",
                hasTail
                  ? isOwnMsg
                    ? "rounded-tr-none"
                    : "rounded-tl-none"
                  : undefined
              )}
            >
              {children}
              <footer className="px-2 flex justify-end items-end gap-1 dark:text-slate-400 text-slate-500 text-sm">
                {reactions.length > 0 && (
                  <div className="select-none mr-auto flex gap-0.5">
                    {reactions.map(({ owner, type }) => (
                      <div
                        key={owner}
                        className="p-1 rounded-full bg-neutral-500/70 text-[18px] leading-none text-center"
                      >
                        {REACTIONS[type].emoji}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 leading-none">
                  {starred && (
                    <span className="w-4 h-4 inline-block">
                      <Star className="text-yellow-500 fill-yellow-500 w-full h-full" />
                    </span>
                  )}
                  {formatTime}
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
