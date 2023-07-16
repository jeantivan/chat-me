import { ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../DarkMode";
import mc from "@/lib/utils/mergeClassnames";

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;
export const AlertDialogRoot = AlertDialogPrimitive.Root;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

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
      ease: "easeOut",
    },
  },
};
interface AlertDialogContentProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function AlertDialogContent({
  open,
  children,
}: AlertDialogContentProps) {
  const { isDarkMode } = useDarkMode();

  return (
    <AnimatePresence>
      {open && (
        <AlertDialogPortal forceMount>
          <AlertDialogPrimitive.Overlay
            className={mc(
              "fixed inset-0 w-screen h-screen bg-slate-50/80 grid place-items-center",
              isDarkMode && "bg-slate-900/80"
            )}
          >
            <AlertDialogPrimitive.Content
              asChild
              style={{ zIndex: 1001 }}
              className={mc(
                "w-[60%] md:w-[50%] lg:w-[40%] shadow-xl bg-white text-neutral-900",
                isDarkMode && "bg-slate-800 text-neutral-50"
              )}
            >
              <motion.div
                variants={contentVariants}
                initial="exit"
                animate="enter"
                exit="exit"
              >
                {children}
              </motion.div>
            </AlertDialogPrimitive.Content>
          </AlertDialogPrimitive.Overlay>
        </AlertDialogPortal>
      )}
    </AnimatePresence>
  );
}
