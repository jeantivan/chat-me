import useStore from "@/lib/store";
import { motion } from "framer-motion";
import { IconButton } from "./ui/IconButton";
import { ArrowLeft } from "lucide-react";

export function NewChat() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  return (
    <>
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
          <IconButton
            onClick={closeLeftDrawer}
            className="mr-6"
            icon={ArrowLeft}
            label="Volver atrás"
          />
          <h2 id="left-drawer-title" className="text-neutral-50 text-xl">
            Nuevo chat
          </h2>
        </motion.div>
      </header>
    </>
  );
}
