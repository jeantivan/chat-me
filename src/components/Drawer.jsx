import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

const AnimatedOverlay = motion(Dialog.Overlay);

// Variantes de la animaciones.
const fromVariants = {
  left: {
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
  },
  right: {
    initial: {
      x: "100%",
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
      x: "100%",
      transition: {
        type: "tween",
      },
    },
  },
  top: {
    initial: {
      y: "-100%",
    },
    enter: {
      y: "0%",
      transition: {
        type: "tween",
        duration: 0.15,
        when: "beforeChildren",
        staggerChildren: 0.01,
      },
    },
    exit: {
      y: "-100%",
      transition: {
        type: "tween",
      },
    },
  },
  bottom: {
    initial: {
      y: "100%",
    },
    enter: {
      y: "0%",
      transition: {
        type: "tween",
        duration: 0.15,
        when: "beforeChildren",
        staggerChildren: 0.01,
      },
    },
    exit: {
      y: "100%",
      transition: {
        type: "tween",
      },
    },
  },
};

const overlayVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

const fromClasses = {
  left: "top-0 left-0",
  right: "top-0 right-0",
  top: "top-0 right-0 left-0",
  bottom: "bottom-0 right-0 left-0",
};

export function Drawer({ from, children, open }) {
  return (
    <AnimatePresence>
      {open ? (
        <Dialog.Portal
          forceMount
          className="absolute inset-0 w-screen h-screen"
        >
          <AnimatedOverlay
            forceMount
            variants={overlayVariants}
            className="bg-black/50 fixed inset-0 w-screen h-screen"
          />
          <Dialog.Content forceMount asChild>
            <motion.div
              variants={fromVariants[from]}
              initial="initial"
              animate="enter"
              exit="exit"
              style={{ zIndex: 1000 }}
              className={`drawer h-screen fixed ${fromClasses[from]}`}
            >
              {children}
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      ) : null}
    </AnimatePresence>
  );
}
