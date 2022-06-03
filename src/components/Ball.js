//import { motion, useMotionValue } from "framer-motion";
import { forwardRef, useState, useRef } from "react";

import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

export const Ball = forwardRef(({ containerDimensions }, containerRef) => {
  const [tap, setTap] = useState(false);
  const ballRef = useRef(null);
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const bind = useDrag(
    ({ down, movement: [x, y], last, initial, offset }) => {
      setTap(down);
      let newX = 0;
      let newY = 0;
      if (containerRef) {
        // Dimensiones y punto medio del Contenedor Padre
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerMiddleX = containerRect.width / 2;
        const containerMiddleY = containerRect.height / 2;

        const ballDimensions = ballRef.current.getBoundingClientRect();

        newX =
          x < containerMiddleX ? 0 : containerRect.width - ballDimensions.width;
        newY =
          y < containerMiddleY
            ? 0
            : containerRect.height - ballDimensions.width;
      }
      console.log(offset);
      console.log({ x, y });
      console.log({ newX, newY });

      return api.start(() => ({
        x: down ? x : newX,
        y: down ? y : newY,
        immediate: down,
      }));
    },
    { bounds: containerRef }
  );

  return (
    <animated.div
      ref={ballRef}
      className="absolute"
      {...bind()}
      style={{ x, y, touchAction: "none" }}
    >
      <div className="w-20 h-20 rounded-full shadow-xl bg-slate-600 flex justify-center items-center text-4xl">
        <span
          className="inline-flex select-none"
          role="img"
          aria-label="Emoji Sonriente"
        >
          {tap ? "😲" : "😁"}
        </span>
      </div>
    </animated.div>
  );
});
