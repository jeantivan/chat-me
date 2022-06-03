import { motion, useMotionValue } from "framer-motion";
import { useState } from "react";
import { useWindowDimensions } from "../utils/hook";

export function Ball() {
  const [tap, setTap] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const { width, height } = useWindowDimensions();

  console.log(width, height);

  const handleDrag = (newX, newY) => {
    x.set(newX);
    y.set(newY);
  };

  return (
    <motion.div
      className="absolute"
      whileHover={{ scale: 1.1 }}
      onDragStart={() => setTap(true)}
      onDragEnd={() => setTap(false)}
      whileDrag={{ scale: 1 }}
      drag
      dragElastic={0}
      dragConstraints={{
        left: 0,
        top: 0,
        right: width - 32 - 96,
        bottom: height - 32 - 96,
      }}
      dragSnapToOrigin={false}
    >
      <div className="w-20 h-20 rounded-full shadow-xl bg-slate-600 hover:cursor-pointer flex justify-center items-center text-4xl">
        <span
          className="inline-flex select-none"
          role="img"
          aria-label="Emoji Sonriente"
        >
          {tap ? "😲" : "😁"}
        </span>
      </div>
    </motion.div>
  );
}
