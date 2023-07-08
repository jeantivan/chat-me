import { ReactNode } from "react";
import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";
import { CustomIcon } from "@/components/CustomIcon";

const headerVariants = {
  transition: { type: "tween", delay: 0.15 },
  initial: {
    x: -20,
    opacity: 0,
  },
  enter: {
    x: 0,
    opacity: 1,
  },
};

interface HeaderProps {
  children: ReactNode;
  goBack: () => void;
}
export function Header({ children, goBack }: HeaderProps) {
  return (
    <header className="pt-16 bg-emerald-700 dark:bg-slate-700 pb-5">
      <motion.div
        transition={{ type: "tween", delay: 0.15 }}
        initial={{
          x: -20,
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        className="px-4 flex items-center"
      >
        <button onClick={goBack} className="w-7 h-7 text-neutral-50 mr-4">
          <CustomIcon icon={BsArrowLeft} label="Volver atrás" />
        </button>
        <h2 id="left-drawer-title" className="text-neutral-50 text-xl">
          {children}
        </h2>
      </motion.div>
    </header>
  );
}
