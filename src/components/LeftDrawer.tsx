import { ComponentType, ReactNode } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import useStore from "@/lib/store";
import { LeftDrawerContentOptions } from "@/lib/types";

const drawerVariants: Variants = {
  initial: {
    x: "-100%",
  },
  enter: {
    x: "0%",
    transition: {
      type: "tween",
      ease: "circIn",
      when: "beforeChildren",
      staggerChildren: 0.01,
    },
  },
  exit: {
    x: "-100%",
    transition: {
      type: "tween",
      ease: "circOut",
    },
  },
};

export const LeftDrawerElement = ({
  option,
  Component,
}: {
  option: LeftDrawerContentOptions;
  Component: ComponentType;
}) => {
  const leftDrawer = useStore((state) => state.leftDrawer);

  return leftDrawer === option ? <Component /> : null;
};

export function LeftDrawer({ children }: { children: ReactNode }) {
  const leftDrawer = useStore((state) => state.leftDrawer);

  const leftDrawerContainer = document.getElementById("left-column");

  if (!leftDrawerContainer) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {leftDrawer && (
        <motion.div
          variants={drawerVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          style={{ zIndex: 1000 }}
          className="absolute inset-0 w-full h-screen"
        >
          <div
            role="dialog"
            id="left-drawer-dialog"
            aria-labelledby="left-drawer-title"
            tabIndex={-1}
            className="bg-background-1 w-full h-full flex flex-col pointer-events-auto"
          >
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
