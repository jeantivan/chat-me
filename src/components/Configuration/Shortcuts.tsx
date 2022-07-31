import cx from "classnames";
import { useState } from "react";
import { BsKeyboardFill } from "react-icons/bs";
import { CustomIcon } from "../CustomIcon";
import { useDarkMode } from "../DarkMode";
import {
  DialogRoot,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogContent,
} from "../Dialog";
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
        "py-3 lg:px-3",
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
    <DialogRoot open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger
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
      </DialogTrigger>
      <DialogContent
        open={openModal}
        className="w-4/5 lg:w-3/5 max-h-[95vh] overflow-y-auto"
      >
        <div className="py-4 px-8">
          <header className="mb-4 auto-rows-min">
            <DialogTitle
              className={`text-xl ${
                !isDarkMode ? "text-neutral-900" : "text-neutral-50"
              }`}
            >
              Atajos del teclado
            </DialogTitle>
          </header>
          <div className="lg:-mx-3 overflow-y-auto">
            <div className="flex w-full flex-col md:flex-row flex-wrap">
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <Shortcut key={shortcut.slug} {...shortcut} />
              ))}
            </div>
          </div>
          <footer className="flex justify-end pt-4">
            <DialogClose className="py-2 px-6 inline-flex items-center justify-center rounded uppercase font-medium text-white bg-emerald-600">
              Ok
            </DialogClose>
          </footer>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
