import * as DialogPrimitive from "@radix-ui/react-dialog";
import cx from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { useDarkMode } from "../DarkMode";
import mc from "@/lib/utils/mergeClassnames";

const contentVariants = {
  enter: {
    scale: 1,
    transition: {
      duration: 0.1,
      type: "tween",
      ease: "easeIn",
    },
  },
  exit: {
    scale: 0,
    transition: {
      duration: 0.1,
      type: "tween",
      ease: "easeIn",
    },
  },
};

const overlayVariants = {
  enter: {
    opacity: 1,
    transition: {
      duration: 0.05,
      when: "beforeChildren",
      type: "tween",
      ease: "easeIn",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.05,
      when: "afterChildren",
      type: "tween",
      ease: "easeIn",
    },
  },
};

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogTitle = DialogPrimitive.Title;
export const DialogRoot = DialogPrimitive.Root;

const AnimateContent = motion(DialogPrimitive.Content);
const AnimateOverlay = motion(DialogPrimitive.Overlay);

interface DialogContentProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function DialogContent({
  open,
  children,
  className,
}: DialogContentProps) {
  const { isDarkMode } = useDarkMode();

  return (
    <AnimatePresence>
      {open && (
        <DialogPortal forceMount>
          <AnimateOverlay
            variants={overlayVariants}
            initial="exit"
            animate="enter"
            exit="exit"
            style={{ zIndex: 1000 }}
            className={mc(
              "fixed inset-0 w-screen h-screen backdrop-blur-sm bg-neutral-50/80",
              isDarkMode && "bg-neutral-900/80"
            )}
          />
          <AnimateContent
            variants={contentVariants}
            initial="exit"
            animate="enter"
            exit="exit"
            style={{ zIndex: 1001 }}
            className={mc(
              "fixed inset-0 w-screen h-screen",
              "flex justify-center items-center"
            )}
          >
            <div
              className={mc(
                "bg-white shadow-xl",
                isDarkMode && "bg-[#26292B]",
                className
              )}
            >
              {children}
            </div>
          </AnimateContent>
        </DialogPortal>
      )}
    </AnimatePresence>
  );
}
