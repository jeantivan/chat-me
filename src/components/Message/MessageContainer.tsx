import cx from "classnames";
import { ReactNode, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { MenuContent, MenuItem } from "../Menu";
import { Reactions, ReactionsRoot, ReactionsTrigger } from "../Reactions";
import { DeleteMessage } from "./DeleteMessage";
import { MessageType, ReactionListType } from "../../types";
import { MessageReactions } from "./MessageReactions";

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
      //zIndex: "-1",
      transform: isOwnMsg
        ? "translate3d(-2%, 0, 10px)"
        : "translate3d(-98%, 0, 10px)",
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

interface MessageContainerProps extends MessageType {
  children: ReactNode;
  hasTail: boolean;
  deleteMsg: (id: string) => void;
  favMsg: (id: string) => void;
  addOwnReaction: (id: string, reactionType: ReactionListType) => void;
  changeOwnReaction: (id: string, reactionType: ReactionListType) => void;
  deleteOwnReaction: (id: string) => void;
}

export function MessageContainer({
  children,
  isOwnMsg,
  isFavMsg,
  hasTail,
  reactions,
  deleteMsg,
  id,
  addOwnReaction,
  changeOwnReaction,
  deleteOwnReaction,
  favMsg,
  message,
}: MessageContainerProps) {
  const [openReactions, setOpenReactions] = useState(false);
  const controls = useAnimation();

  const ownReaction = reactions.find(
    ({ reaction }) => reaction.isOwnReaction === true
  );

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
        "mt-1.5": !hasTail,
      })}
    >
      <div className="w-full flex">
        <div
          className={cx(
            "relative drop-shadow",
            "max-w-9/10 md:max-w-8/10 lg:max-w-7/10",
            {
              "justify-start": !isOwnMsg,
              "justify-end": isOwnMsg,
            },
            {
              "w-[350px]":
                message.orientation === "squarish" || message.type === "audio",
              "w-[390px]": message.orientation === "landscape",
              "w-[273px]": message.orientation === "portrait",
            }
          )}
        >
          {hasTail && <MessageTail isOwnMsg={isOwnMsg} />}
          <div
            className={cx("rounded-md overflow-hidden group", {
              "rounded-tl-none": hasTail && !isOwnMsg,
              "rounded-tr-none": hasTail && isOwnMsg,
            })}
          >
            {children}
          </div>
          {reactions.length > 0 && (
            <MessageReactions isOwnMsg={isOwnMsg} reactions={reactions} />
          )}
        </div>

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
              className={cx({ "-mt-[30px]": reactions.length > 0 })}
            >
              <ReactionsTrigger />
            </motion.div>

            <Reactions
              closeMenu={() => {
                setOpenReactions(false);
              }}
              ownReaction={ownReaction}
              msgId={id}
              addOwnReaction={addOwnReaction}
              deleteOwnReaction={deleteOwnReaction}
              changeOwnReaction={changeOwnReaction}
            />
          </div>
        </ReactionsRoot>
      </div>
      <MenuContent align={isOwnMsg ? "end" : "start"} className="w-48">
        {isOwnMsg && <MenuItem>Info. del mensaje</MenuItem>}
        <MenuItem>Responder</MenuItem>
        <MenuItem
          onClick={() => {
            setOpenReactions(true);
          }}
        >
          Reaccionar al Mensaje
        </MenuItem>
        <MenuItem>Reenviar mensaje</MenuItem>
        <MenuItem
          onClick={() => {
            favMsg(id);
          }}
        >
          {isFavMsg < 0 ? "Destacar mensaje" : "No destacar mensaje"}
        </MenuItem>
        <DeleteMessage msgId={id} deleteMsg={deleteMsg} />
      </MenuContent>
    </motion.div>
  );
}
