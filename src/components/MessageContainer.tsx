import cx from "classnames";
import { ReactNode, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { BsChevronDown } from "react-icons/bs";
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "./Menu";
import { CustomIcon } from "./CustomIcon";
import { Reactions, ReactionsRoot, ReactionsTrigger } from "./Reactions";

const MessageTail = ({ isOwnMsg }: { isOwnMsg: boolean }) => (
  <span
    aria-hidden={true}
    className={cx(
      "w-3 h-3 fixed top-0",
      {
        "dark:bg-emerald-700 bg-green-200": isOwnMsg,
        "dark:bg-slate-700 bg-white": !isOwnMsg,
      },
      { "left-full": isOwnMsg, "left-0": !isOwnMsg }
    )}
    style={{
      //zIndex: "-1",
      transform: isOwnMsg
        ? "translate3d(-2%, 0, -10px)"
        : "translate3d(-98%, 0, -10px)",
      borderRadius: isOwnMsg
        ? "95% 5% 100% 0% / 0% 5% 95% 100%"
        : "5% 95% 0% 100% / 5% 0% 100% 95%",
    }}
  />
);

const buttonVariants = {
  hidden: { opacity: 0, transition: { duration: 0.05 } },
  show: { opacity: 1, transition: { duration: 0.05 } },
};

interface MessageContainerProps {
  children: ReactNode;
  isOwnMsg: boolean;
  hasTail: boolean;
}

export function MessageContainer({
  children,
  isOwnMsg,
  hasTail,
}: MessageContainerProps) {
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
        "mt-4": hasTail,
        "mt-1": !hasTail,
      })}
    >
      <div
        className={cx("w-full flex", {
          "justify-start": !isOwnMsg,
          "justify-end": isOwnMsg,
        })}
      >
        <MenuRoot open={openMenu} onOpenChange={setOpenMenu}>
          <div className="w-auto max-w-9/10 md:max-w-8/10 lg:max-w-7/10 drop-shadow">
            <div>
              <div
                className={cx(
                  "overflow-hidden p-1.5 flex flex-wrap group",
                  {
                    "dark:bg-emerald-700 bg-green-200": isOwnMsg,
                    "dark:bg-slate-700 bg-white": !isOwnMsg,
                  },
                  { "rounded-b": hasTail, rounded: !hasTail },
                  { "rounded-tl": isOwnMsg, "rounded-tr": !isOwnMsg }
                )}
              >
                {children}
                <MenuTrigger
                  className={cx(
                    "transition opacity-0 translate-x-full group-hover:-translate-x-0 group-hover:opacity-100",
                    { "-translate-x-0 opacity-100": openMenu },
                    "text-lg text-gray-400",
                    "w-10 rounded-tr inline-flex justify-center",
                    "px-2 py-0.5 absolute top-0 right-0",
                    "menu-trigger-bg",
                    {
                      "menu-trigger-bg-main dark:menu-trigger-bg-main":
                        isOwnMsg,
                      "menu-trigger-bg-secondary dark:menu-trigger-bg-secondary":
                        !isOwnMsg,
                    }
                  )}
                >
                  <CustomIcon
                    Icon={BsChevronDown}
                    label="Mostrar menu"
                    className="inline-block w-5"
                    iconClassName="stroke-1"
                  />
                </MenuTrigger>
              </div>
            </div>
            {hasTail && <MessageTail isOwnMsg={isOwnMsg} />}
          </div>
          <MenuContent align={isOwnMsg ? "end" : "start"} className="w-48">
            <MenuItem>Info. del mensaje</MenuItem>
            <MenuItem>Responder</MenuItem>
            <MenuItem>Reaccionar al Mensaje</MenuItem>
            <MenuItem>Reenviar mensaje</MenuItem>
            <MenuItem>Destacar mensaje</MenuItem>
            <MenuItem>Eliminar mensaje</MenuItem>
          </MenuContent>
        </MenuRoot>

        <ReactionsRoot open={openReactions} onOpenChange={setOpenReactions}>
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
              <ReactionsTrigger />
            </motion.div>

            <Reactions />
          </div>
        </ReactionsRoot>
      </div>
    </motion.div>
  );
}
