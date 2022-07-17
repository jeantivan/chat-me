import cx from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { IconType } from "react-icons";
import { CustomIcon } from "./CustomIcon";

const itemVariants = {
  enter: {
    scale: 1,
    opacity: 1,
    y: "0%",
  },
  exit: {
    scale: 0,
    opacity: 0,
    y: "50%",
  },
};

const tooltipVariants = {
  transition: { type: "tween", duration: 0.02 },
  hidden: {
    opacity: 0,
    x: "-50%",
    transition: { ease: "easeOut" },
  },
  show: {
    opacity: 1,
    x: "0%",
    transition: { ease: "easeIn" },
  },
};

interface FabInterface {
  label: string;
  icon: IconType;
  bgColor: string;
  beforeBgColor?: string;
}

export function Fab({ label, icon, bgColor, beforeBgColor }: FabInterface) {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  return (
    <motion.div
      onHoverStart={() => {
        setShowTooltip(true);
      }}
      onHoverEnd={() => {
        setShowTooltip(false);
      }}
      variants={itemVariants}
      className="flex items-center mb-4 w-full origin-bottom"
    >
      <button
        className={cx(
          "w-12 h-12 rounded-full text-white",
          "flex items-center justify-center relative overflow-hidden z-20",
          "before:content-[''] before:absolute before:top-0 before:right-0 before:-z-10 before:w-full before:h-1/2",
          beforeBgColor,
          bgColor
        )}
      >
        <CustomIcon className="w-5 h-5" label={label} Icon={icon} />
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="bg-white text-neutral-900 ml-4 px-3 py-1 text-sm capitalize rounded-2xl"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
