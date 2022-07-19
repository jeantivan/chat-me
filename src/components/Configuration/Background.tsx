import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";
import { CustomIcon } from "../CustomIcon";

interface BackgroundProps {
  goBack: () => void;
}

export function Background({ goBack }: BackgroundProps) {
  return (
    <>
      <header className="pt-16 bg-slate-700 pb-5 ">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: "tween" }}
          className="px-4 flex items-center"
        >
          <button
            onClick={goBack}
            className="w-7 h-7 dark:text-slate-400 text-slate-500 hover:text-slate-400 mr-4"
          >
            <CustomIcon Icon={BsArrowLeft} label="Cerrar configuración" />
          </button>

          <h2 id="left-drawer-title" className="text-slate-50 text-xl">
            Elegir color de fondo
          </h2>
        </motion.div>
      </header>
    </>
  );
}
