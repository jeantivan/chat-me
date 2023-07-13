import { ComponentType, ReactNode } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import useStore from "@/lib/store";
import { RightDrawerContentOptions } from "@/lib/types";

const drawerVariants: Variants = {
  initial: {
    width: "0%",
    transition: {
      type: "tween",
      ease: "circOut",
      duration: 0.3,
    },
  },
  enter: {
    width: "40%",
    transition: {
      type: "tween",
      ease: "circIn",
      when: "beforeChildren",
      staggerChildren: 0.01,
      duration: 0.3,
    },
  },
};

export const RightDrawerElement = ({
  option,
  Component,
}: {
  option: RightDrawerContentOptions;
  Component: ComponentType;
}) => {
  const rightDrawer = useStore((state) => state.rightDrawer);

  return rightDrawer === option ? <Component /> : null;
};

export function RightDrawer({ children }: { children: ReactNode }) {
  const rightDrawer = useStore((state) => state.rightDrawer);

  return (
    rightDrawer && (
      <motion.div
        variants={drawerVariants}
        initial="initial"
        animate="enter"
        exit="initial"
        layout="size"
      >
        <div
          role="dialog"
          id="right-drawer-dialog"
          aria-labelledby="right-drawer-title"
          tabIndex={-1}
          className="relative inset-0 h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-600"
        >
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </div>
      </motion.div>
    )
  );
}
