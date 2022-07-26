import { ReactNode } from "react";
import { motion } from "framer-motion";

const variants = {
  show: {
    x: "0%",
    transition: {
      type: "tween",
      duration: 0.15,
      ease: "easeIn",
    },
  },
  hide: {
    x: "100%",
    transition: { type: "tween", duration: 0.15, ease: "easeIn" },
  },
};

export function AnimateOptionChange({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex flex-col h-full"
      variants={variants}
      initial="hide"
      animate="show"
      exit="hide"
    >
      {children}
    </motion.div>
  );
}
