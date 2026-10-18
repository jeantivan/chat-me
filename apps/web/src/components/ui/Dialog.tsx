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
  overlayClassName?: string;
  scroll?: boolean;
}

export function DialogContent({
  open,
  children,
  className,
  overlayClassName,
  scroll = true,
}: DialogContentProps) {
  const { container } = useDialogContainer();

  return (
    <AnimatePresence>
      {open && (
        <DialogPortal forceMount container={container}>
          {scroll ? (
            <DialogPrimitive.Overlay
              style={{ zIndex: 1000 }}
              className={mc(
                "fixed inset-0 overflow-y-auto backdrop-blur-sm bg-background-1/70",
                overlayClassName
              )}
            >
              <DialogPrimitive.Content asChild>
                <motion.div
                  variants={contentVariants}
                  initial="exit"
                  animate="enter"
                  exit="exit"
                  className={mc("grid place-items-center", className)}
                >
                  {children}
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Overlay>
          ) : (
            <>
              <DialogPrimitive.Overlay
                style={{ zIndex: 1000 }}
                className={mc(
                  "fixed inset-0 overflow-y-auto backdrop-blur-sm bg-background-1/70",
                  overlayClassName
                )}
              />
              <DialogPrimitive.Content asChild>
                <motion.div
                  variants={contentVariants}
                  initial="exit"
                  animate="enter"
                  exit="exit"
                  style={{ zIndex: 1001 }}
                  className={mc(
                    "fixed inset-0 flex justify-center items-center",
                    className
                  )}
                >
                  {children}
                </motion.div>
              </DialogPrimitive.Content>
            </>
          )}
        </DialogPortal>
      )}
    </AnimatePresence>
  );
}
