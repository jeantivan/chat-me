import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import mc from "@/lib/utils/mergeClassnames";
import { useDialogContainer } from "@/components/DialogContainer";

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

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogTitle = DialogPrimitive.Title;
export const DialogRoot = DialogPrimitive.Root;

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
  const { container } = useDialogContainer();

  return (
    <AnimatePresence>
      {open && (
        <DialogPortal forceMount container={container}>
          <DialogPrimitive.Overlay
            style={{ zIndex: 1000 }}
            className="fixed inset-0 grid place-items-center overflow-y-auto backdrop-blur-sm bg-background-1/80"
          >
            <DialogPrimitive.Content asChild>
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
            </DialogPrimitive.Content>
          </DialogPrimitive.Overlay>
        </DialogPortal>
      )}
    </AnimatePresence>
  );
}
