import { ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useDialogContainer } from "@/components/DialogContainer";
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
      duration: 0.2,
      type: "tween",
      ease: "circIn",
    },
  },
  exit: {
    scale: 0,
    transition: {
      duration: 0.2,
      type: "tween",
      ease: "circOut",
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
  className,
  children,
}: AlertDialogContentProps) {
  const { container } = useDialogContainer();

  return (
    <AnimatePresence>
      {open && (
        <AlertDialogPortal forceMount container={container}>
          <AlertDialogPrimitive.Overlay
            style={{ zIndex: 1000 }}
            className="fixed inset-0 grid place-items-center overflow-y-auto backdrop-blur-sm bg-background-1/80"
          >
            <AlertDialogPrimitive.Content asChild>
              <motion.div
                variants={contentVariants}
                initial="exit"
                animate="enter"
                exit="exit"
                className={mc(
                  "min-w-[40%] my-6 rounded-lg",
                  "bg-background-2 text-background-12 shadow-xl",
                  className
                )}
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
