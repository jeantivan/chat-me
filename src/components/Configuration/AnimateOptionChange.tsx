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

export function AnimateOptionChange({
  children,
  isNotAnimated,
}: {
  children: ReactNode;
  isNotAnimated?: boolean;
}) {
  if (isNotAnimated) {
    return <div className="flex flex-col h-full">{children}</div>;
  } else {
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
}
