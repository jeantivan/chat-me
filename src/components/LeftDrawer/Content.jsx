import { useRef } from "react";
import { useEventListener } from "usehooks-ts";
import { AnimatePresence, motion } from "framer-motion";
import { useLeftDrawer } from "./Context";
import { Profile } from "../Configuration/Profile";
import { Configuration } from "../Configuration";

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
  CONFIGURATION: <Configuration />,
  USER_PROFILE: <Profile />,
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
          <div
            role="dialog"
            id="left-drawer-dialog"
            aria-labelledby="left-drawer-title"
            tabIndex="-1"
            className="bg-neutral-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-600 w-full h-full flex flex-col pointer-events-auto"
          >
            {contentOptions[renderContent]}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
