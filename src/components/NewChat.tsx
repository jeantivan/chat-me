import useStore from "@/lib/store";
import { motion } from "framer-motion";
import { IconButton } from "./ui/IconButton";
import { ArrowLeft } from "lucide-react";

export function NewChat() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  return (
    <>
      <header className="pt-16 bg-primary-9 dark:bg-background-2 pb-5">
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
          className="px-4 flex items-center gap-6"
        >
          <IconButton
            onClick={closeLeftDrawer}
            className="text-background-1 dark:text-background-12 hover:bg-background-6/20"
            icon={ArrowLeft}
            label="Volver atrás"
          />
          <h2
            id="left-drawer-title"
            className="text-background-1 dark:text-background-12 text-xl"
          >
            Chat nuevo
          </h2>
        </motion.div>
      </header>
    </>
  );
}
