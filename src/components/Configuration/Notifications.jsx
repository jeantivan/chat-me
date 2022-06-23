import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";

export function Notifications({ goBack }) {
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
            <AccessibleIcon.Root label="Cerrar configuración">
              <BsArrowLeft className="w-full h-full" />
            </AccessibleIcon.Root>
          </button>

          <Dialog.Title className="text-slate-50 text-xl">
            Notificaciones
          </Dialog.Title>
        </motion.div>
      </header>
    </>
  );
}
