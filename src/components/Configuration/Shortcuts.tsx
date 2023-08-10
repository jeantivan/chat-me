import { useState } from "react";
import { Keyboard } from "lucide-react";
import { CustomIcon } from "@/components/CustomIcon";
import {
  DialogRoot,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogContent,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { KEYBOARD_SHORTCUTS } from "@/lib/utils/keyboard-shortcuts";
import { TShortCut } from "@/lib/types";
import mc from "@/lib/utils/mergeClassnames";

const Key = ({ text }: { text: string }) => (
  <div
    className={mc(
      "py-1 px-2 ml-2",
      "text-xs capitalize",
      "border rounded border-background-10 shadow-sm",
      "bg-background-7"
    )}
  >
    {text}
  </div>
);

const Shortcut = ({ title, keys }: TShortCut) => {
  return (
    <div
      className={mc(
        "w-full md:w-1/2 py-3 lg:px-3",
        "flex items-center justify-between"
      )}
    >
      <div className={"text-sm mr-2 grow-0 shrink"}>{title}</div>
      <div className="flex flex-1 justify-end">
        {keys.map((key) => (
          <Key key={key} text={key} />
        ))}
      </div>
    </div>
  );
};

export function Shortcuts() {
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
      <DialogContent open={openModal}>
        <div
          className={mc(
            "min-w-[40%] w-4/5 lg:w-3/5 my-6 rounded-lg p-6",
            "bg-background-2 text-background-12 shadow-xl"
          )}
        >
          <header className="mb-4">
            <DialogTitle className="text-xl">Atajos del teclado</DialogTitle>
          </header>
          <div className="lg:-mx-3">
            <div className="flex w-full flex-col md:flex-row flex-wrap">
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <Shortcut key={shortcut.slug} {...shortcut} />
              ))}
            </div>
          </div>
          <footer className="flex justify-end pt-4">
            <DialogClose asChild>
              <Button>Ok</Button>
            </DialogClose>
          </footer>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
