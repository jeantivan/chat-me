//import { motion, useMotionValue } from "framer-motion";
import { forwardRef, useState, useRef, useEffect } from "react";

import { animated, useSpring, config } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";

export const Ball = forwardRef((_, containerRef) => {
  const [tap, setTap] = useState(false);
  const [position, setPosition] = useState("TOP_LEFT");
  const ballRef = useRef(null);
  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: config.stiff,
  }));

  const bind = useDrag(
    ({ down, offset: [ox, oy], last }) => {
      setTap(down);
      if (containerRef && last) {
        let newX = 0;
        let newY = 0;
        let newXPosition = "";
        let newYPosition = "";

        const ballDimensions = ballRef.current.getBoundingClientRect();

        // Dimensiones y punto medio del Contenedor Padre
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerMiddleX = containerRect.width / 2;
        const containerMiddleY = containerRect.height / 2;

        if (ox < containerMiddleX) {
          newX = 0;
          newXPosition = "LEFT";
        } else {
          newX = containerRect.width - ballDimensions.width;
          newXPosition = "RIGHT";
        }

        if (oy < containerMiddleY) {
          newY = 0;
          newYPosition = "TOP";
        } else {
          newY = containerRect.height - ballDimensions.width;
          newYPosition = "BOTTOM";
        }

        api.start(() => ({ x: newX, y: newY, immediate: down }));
        return setPosition(`${newYPosition}_${newXPosition}`);
      }

      return api.start(() => ({ x: ox, y: oy, immediate: down }));
    },
    { bounds: containerRef, from: () => [x.get(), y.get()] }
  );

  useEffect(
    function handleWindowResize() {
      const container = containerRef.current;
      const ball = ballRef.current;
      const handleResize = (e) => {
        if (container && ball) {
          const containerRect = container.getBoundingClientRect();
          const ballDimensions = ball.getBoundingClientRect();

          const getPosition = {
            TOP_LEFT: { x: 0, y: 0, immediate: true },
            TOP_RIGHT: {
              x: containerRect.width - ballDimensions.width,
              y: 0,
              immediate: true,
            },
            BOTTOM_LEFT: {
              x: 0,
              y: containerRect.height - ballDimensions.height,
              immediate: true,
            },
            BOTTOM_RIGHT: {
              x: containerRect.width - ballDimensions.width,
              y: containerRect.height - ballDimensions.height,
              immediate: true,
            },
          };
          console.log(position);
          api.start(getPosition[`${position}`]);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    },

    [api, containerRef, x, y, position]
  );

  useEffect(() => {
    console.log("Current Position: ");
    console.log(position);
  }, [position]);

  return (
    <animated.div
      ref={ballRef}
      className="absolute z-50"
      {...bind()}
      style={{
        x,
        y,
        touchAction: "none",
        cursor: tap ? "grabbing" : "initial",
      }}
    >
      <div className="w-20 h-20 rounded-full shadow-xl hover:cursor-grab bg-slate-600 flex justify-center items-center text-4xl">
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
