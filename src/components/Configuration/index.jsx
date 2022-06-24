import { useState } from "react";
import { BsGearFill } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { useDarkMode } from "../DarkMode";
import { Options } from "./Options";
import { Notifications } from "./Notifications";
import { Privacy } from "./Privacy";
import { Help } from "./Help";
import { Background } from "./Background";
import { Profile } from "./Profile";
import { Security } from "./Security";
import { SolInfo } from "./SolInfo";
import { Theme } from "./Theme";

const AnimatedOverlay = motion(Dialog.Overlay);

const OPTIONS = "OPTIONS";
const renderOptions = {
  OPTIONS: (props) => <Options {...props} />,
  NOTIFICATIONS: (props) => <Notifications {...props} />,
  PROFILE: (props) => <Profile {...props} />,
  PRIVACY: (props) => <Privacy {...props} />,
  SECURITY: (props) => <Security {...props} />,
  THEME: (props) => <Theme {...props} />,
  BACKGROUND: (props) => <Background {...props} />,
  SOL_INFO: (props) => <SolInfo {...props} />,
  HELP: (props) => <Help {...props} />,
};

export function Configuration() {
  const { mode } = useDarkMode();

  const [openModal, setOpenModal] = useState(false);
  const [renderComponent, setRender] = useState(OPTIONS);

  const goBack = () => {
    setRender(OPTIONS);
  };

  return (
    <Dialog.Root open={openModal} onOpenChange={setOpenModal}>
      <Dialog.Trigger asChild>
        <button className="w-full py-2 px-4 flex items center dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
          <span>Configuración</span>
          <span className="ml-auto w-6 text-neutral-700 dark:text-neutral-50">
            <AccessibleIcon.Root label="Icono de configuración">
              <BsGearFill className="w-full h-full" />
            </AccessibleIcon.Root>
          </span>
        </button>
      </Dialog.Trigger>
      <AnimatePresence>
        {openModal ? (
          <Dialog.Portal
            forceMount
            className="absolute inset-0 w-screen h-screen"
          >
            <AnimatedOverlay
              forceMount
              transition={{ duration: 0.15, type: "tween" }}
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="bg-black/50 w-screen h-screen"
            />
            <Dialog.Content forceMount asChild>
              <motion.div
                transition={{
                  duration: 0.15,
                  type: "tween",
                }}
                animate={{ x: "0%" }}
                initial={{ x: "-100%" }}
                exit={{ x: "-100%" }}
                style={{ width: "30vw", zIndex: 1000 }}
                className={`${
                  mode === "light" ? "bg-white" : "bg-slate-800"
                } h-screen absolute left-0 top-0 flex flex-col`}
              >
                <AnimatePresence exitBeforeEnter>
                  {renderOptions[renderComponent]({ setRender, goBack })}
                </AnimatePresence>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
