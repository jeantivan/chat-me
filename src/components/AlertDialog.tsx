import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import cx from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { useDarkMode } from "./DarkMode";

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

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;
export const AlertDialogRoot = AlertDialogPrimitive.Root;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

const AnimateContent = motion(AlertDialogPrimitive.Content);
const AnimateOverlay = motion(AlertDialogPrimitive.Overlay);

interface AlertDialogContentProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function AlertDialogContent({
  open,
  children,
  className,
}: AlertDialogContentProps) {
  const { isDarkMode } = useDarkMode();

  return (
    <AnimatePresence>
      {open && (
        <AlertDialogPortal forceMount>
          <AnimateOverlay
            variants={overlayVariants}
            initial="exit"
            animate="enter"
            exit="exit"
            style={{ zIndex: 1000 }}
            className={cx("fixed inset-0 w-screen h-screen", {
              "bg-neutral-900/80": isDarkMode,
              "bg-neutral-50/80": !isDarkMode,
            })}
          />
          <AnimateContent
            variants={contentVariants}
            initial="exit"
            animate="enter"
            exit="exit"
            style={{ zIndex: 1001 }}
            className={cx(
              "fixed inset-0 w-screen h-screen",
              "flex justify-center items-center"
            )}
          >
            <div
              className={cx(
                {
                  "bg-white": !isDarkMode,
                  "bg-gray-600": isDarkMode,
                },
                "shadow-xl",
                className
              )}
            >
              {children}
            </div>
          </AnimateContent>
        </AlertDialogPortal>
      )}
    </AnimatePresence>
  );
}
