import { useRef } from "react";
import { useEventListener } from "usehooks-ts";
import { AnimatePresence, motion } from "framer-motion";
import { useLeftDrawer } from "./Context";

const drawerVariants = {
  initial: {
    x: "-100%",
  },
  enter: {
    x: "0%",
    transition: {
      type: "tween",
      duration: 0.15,
      when: "beforeChildren",
      staggerChildren: 0.01,
    },
  },
  exit: {
    x: "-100%",
    transition: {
      type: "tween",
    },
  },
};

const contentOptions = {
  CONFIGURATION: "CONFIGURATION",
  USER_PROFILE: "USER_PROFILE",
};

export function LeftDrawerContent() {
  const documentRef = useRef(document);
  const { openLeftDrawer, renderContent, closeLeftDrawer } = useLeftDrawer();

  const onKeyUp = (e) => {
    if (e.key === "Escape") closeLeftDrawer();
  };

  useEventListener("keyup", onKeyUp, documentRef);
  return (
    <AnimatePresence>
      {openLeftDrawer ? (
        <motion.div
          variants={drawerVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          style={{ zIndex: 1000 }}
          className="w-full h-screen top-0 left-0 absolute"
        >
          <div className="bg-neutral-50 dark:bg-slate-800 w-full h-full flex flex-col">
            {contentOptions[renderContent]}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
