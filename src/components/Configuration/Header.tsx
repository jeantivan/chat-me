import { ReactNode } from "react";
import { motion } from "framer-motion";
import { CustomIcon } from "../CustomIcon";
import { BsArrowLeft } from "react-icons/bs";

const headerVariants = {
  transition: { type: "tween" },
  initial: {
    x: -20,
    opacity: 0,
  },
  enter: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: -20,
    opacity: 0,
  },
};

interface HeaderProps {
  children: ReactNode;
  goBack: () => void;
}
export function Header({ children, goBack }: HeaderProps) {
  return (
    <header className="pt-16 bg-emerald-700 dark:bg-slate-700 pb-5">
      <motion.div variants={headerVariants} className="px-4 flex items-center">
        <button onClick={goBack} className="w-7 h-7 text-neutral-50 mr-4">
          <CustomIcon Icon={BsArrowLeft} label="Volver atrás" />
        </button>
        <h2 id="left-drawer-title" className="text-neutral-50 text-xl">
          {children}
        </h2>
      </motion.div>
    </header>
  );
}
