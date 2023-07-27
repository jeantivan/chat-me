import cx from "classnames";
import { useState } from "react";
import { CustomIcon } from "@/components/CustomIcon";
import { useDarkMode } from "@/components/DarkMode";
import {
  DialogRoot,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogContent,
} from "@/components/ui/Dialog";
import { KEYBOARD_SHORTCUTS } from "@/lib/utils/keyboard-shortcuts";
import { ShortCut } from "@/lib/types";
import { Keyboard } from "lucide-react";

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
      <DialogTrigger className="w-full flex items-center hover:bg-background-3">
        <span className="w-20 flex items-center justify-center">
          <CustomIcon
            label="Atajos del teclado"
            icon={Keyboard}
            className="w-6 h-6 text-background-10"
          />
        </span>
        <span className="py-5 pr-4 flex-1 border-b text-left text-lg font-medium text-background-12 border-background-7">
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
