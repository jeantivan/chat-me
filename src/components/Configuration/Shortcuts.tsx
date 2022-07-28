import * as Dialog from "@radix-ui/react-dialog";
import cx from "classnames";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsKeyboardFill } from "react-icons/bs";
import { CustomIcon } from "../CustomIcon";
import { useDarkMode } from "../DarkMode";
import { KEYBOARD_SHORTCUTS } from "../../utils/keyboard-shortcuts";
import { ShortCut } from "../../types";

const Key = ({ text, isDarkMode }: { text: string; isDarkMode: boolean }) => (
  <div
    className={cx(
      "py-1 px-2 ml-2",
      "text-xs capitalize",
      "border rounded border-neutral-400 shadow-sm",
      { "bg-neutral-700": isDarkMode, "bg-neutral-200": !isDarkMode }
    )}
  >
    {text}
  </div>
);

const Shortcut = ({ title, keys }: ShortCut) => {
  const { isDarkMode } = useDarkMode();

  return (
    <div
      className={cx(
        "w-full md:w-1/2",
        "flex items-center justify-between",
        "p-3",
        {
          "text-neutral-50": isDarkMode,
          "text-neutral-900": !isDarkMode,
        }
      )}
    >
      <div className={"text-sm mr-2 grow-0 shrink"}>{title}</div>
      <div className="flex flex-1 justify-end">
        {keys.map((key) => (
          <Key key={key} text={key} isDarkMode={isDarkMode} />
        ))}
      </div>
    </div>
  );
};

export function Shortcuts() {
  const { isDarkMode } = useDarkMode();
  const [openModal, setOpenModal] = useState(false);

  return (
    <Dialog.Root open={openModal} onOpenChange={setOpenModal}>
      <Dialog.Trigger
        className={`w-full flex items-center ${
          !isDarkMode ? "hover:bg-slate-50" : "hover:bg-slate-700"
        }`}
      >
        <span className="w-14 flex items-center justify-center">
          <CustomIcon
            label="Atajos del teclado"
            Icon={BsKeyboardFill}
            className="w-5 h-5 text-slate-400"
          />
        </span>
        <span
          className={`py-5 pl-4 flex-1 border-b text-left text-lg ${
            !isDarkMode
              ? "text-black border-slate-200"
              : "text-slate-50 border-slate-700 "
          }`}
        >
          Atajos del teclado
        </span>
      </Dialog.Trigger>
      <AnimatePresence>
        {openModal ? (
          <Dialog.Portal>
            <Dialog.Overlay
              className={cx("fixed inset-0 w-screen h-screen", {
                "bg-neutral-900/80": isDarkMode,
                "bg-neutral-50/80": !isDarkMode,
              })}
              style={{ zIndex: 1000 }}
            />
            <Dialog.Content
              style={{ zIndex: 1001 }}
              className={`w-screen h-screen shadow-lg fixed inset-0 flex items-center justify-center`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "tween" }}
                style={{ height: "calc(100vh - 1rem)" }}
                className={cx(
                  "w-4/5 lg:w-3/5 h-full py-6 px-8 shadow-xl",
                  "flex flex-col justify-start",
                  {
                    "bg-neutral-100": !isDarkMode,
                    "bg-slate-800": isDarkMode,
                  }
                )}
              >
                <header className="mb-2">
                  <Dialog.Title
                    className={`text-xl ${
                      !isDarkMode ? "text-neutral-900" : "text-neutral-50"
                    }`}
                  >
                    Atajos del teclado
                  </Dialog.Title>
                </header>
                <div className="flex-1 self-stretch overflow-y-auto">
                  <div className="flex w-full flex-wrap -mx-3">
                    {KEYBOARD_SHORTCUTS.map((shortcut) => (
                      <Shortcut key={shortcut.slug} {...shortcut} />
                    ))}
                  </div>
                </div>
                <footer className="flex justify-end">
                  <Dialog.Close className="py-2 px-6 inline-flex items-center justify-center rounded uppercase font-medium text-white bg-emerald-600">
                    Ok
                  </Dialog.Close>
                </footer>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
