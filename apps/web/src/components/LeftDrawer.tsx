import { ComponentType, ReactNode } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import useStore from "@/lib/store";
import { LeftDrawerContentOptions } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { IconButton } from "./ui/IconButton";

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

const LeftDrawerHeader = ({ children }: { children: string }) => {
  const ldGoBack = useStore((state) => state.ldGoBack);
  return (
    <header className="pt-16 bg-primary-9 dark:bg-background-2 pb-5">
      <motion.div
        transition={{ type: "tween", delay: 0.15 }}
        initial={{
          x: -20,
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        className="px-4 flex items-center gap-6"
      >
        <IconButton
          className="text-background-1 dark:text-background-12 hover:bg-background-6/20"
          onClick={ldGoBack}
          icon={ArrowLeft}
          label="Volver atrás"
        />
        <h2
          id="left-drawer-title"
          className="text-background-1 dark:text-background-12 text-xl"
        >
          {children}
        </h2>
      </motion.div>
    </header>
  );
};

export type LeftDrawerElementProps = {
  option: LeftDrawerContentOptions;
  title: string;
  Component: ComponentType;
};
export const LeftDrawerElement = ({
  option,
  title,
  Component,
}: LeftDrawerElementProps) => {
  const leftDrawer = useStore((state) => state.leftDrawer);

  if (leftDrawer !== option) return null;

  return (
    <>
      <LeftDrawerHeader>{title}</LeftDrawerHeader>
      <Component />
    </>
  );
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
