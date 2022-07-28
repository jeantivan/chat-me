import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Label from "@radix-ui/react-label";
import * as Dialog from "@radix-ui/react-dialog";
import cx from "classnames";
import { ReactNode, useState } from "react";
import { BsMoonStarsFill } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../DarkMode";
import { CustomIcon } from "../CustomIcon";

const Button: React.FC<{
  children: ReactNode;
  type?: "filled" | "outlined";
  [x: string]: any;
}> = ({ children, type = "filled", ...rest }) => (
  <button
    {...rest}
    className={cx(
      "mr-2 py-2 px-6 min-w-[64px] rounded inline-flex justify-center uppercase font-medium border-solid border",
      {
        "border-emerald-400/40 hover:bg-white/5 text-emerald-400":
          type === "outlined",
      },
      {
        "bg-emerald-500 hover:bg-emerald-400 border-emerald-500 hover:border-emerald-400 text-white":
          type === "filled",
      }
    )}
  >
    {children}
  </button>
);

const RadioItem = ({
  name,
  label,
  isDarkMode,
}: {
  name: string;
  label: string;
  isDarkMode: boolean;
}) => (
  <div className="flex mb-3 items-center select-none">
    <RadioGroup.Item
      value={name}
      id={name}
      className={cx(
        "w-5 h-5 bg-white rounded-full mr-5",
        "inline-flex items-center justify-center",
        { "border shadow": !isDarkMode }
      )}
    >
      <RadioGroup.Indicator className="bg-emerald-500 w-2.5 h-2.5 rounded-full" />
    </RadioGroup.Item>
    <Label.Root
      htmlFor={name}
      className={`text-medium ${!isDarkMode ? "text-black" : "text-white"}`}
    >
      {label}
    </Label.Root>
  </div>
);

interface ThemeProps {
  goBack: () => void;
}

function ThemeContent({ goBack }: ThemeProps) {
  const { isDarkMode, ternaryDarkMode, setDarkMode } = useDarkMode();
  const [value, setValue] = useState(ternaryDarkMode);

  const handleOk = () => {
    if (value !== ternaryDarkMode) {
      setDarkMode(value);
    }
    return goBack();
  };

  return (
    <div className="p-6">
      <Dialog.Title
        className={cx("text-xl mb-5", {
          "text-neutral-900": !isDarkMode,
          "text-neutral-50": isDarkMode,
        })}
      >
        Elegir Tema
      </Dialog.Title>
      <div className="flex flex-col">
        <RadioGroup.Root
          defaultValue={ternaryDarkMode}
          aria-label="Elegir tema"
          className="flex flex-col justify-center"
          value={value}
          onValueChange={(e) => {
            setValue(e as typeof ternaryDarkMode);
          }}
        >
          <RadioItem isDarkMode={isDarkMode} name="light" label="Claro" />
          <RadioItem isDarkMode={isDarkMode} name="dark" label="Oscuro" />
          <RadioItem
            isDarkMode={isDarkMode}
            name="system"
            label="Predeterminado por el sistema"
          />
        </RadioGroup.Root>
        <div className="w-full flex justify-end mt-8">
          <Button type="outlined" onClick={() => goBack()}>
            Cancelar
          </Button>
          <Button
            onClick={handleOk}
            className="py-2 px-4 rounded-md inline-flex justify-center uppercase "
          >
            Ok
          </Button>
        </div>
      </div>
    </div>
  );
}

const modalVariants = {
  enter: {
    scale: 1,
    transition: {
      type: "tween",
      ease: "easeIn",
    },
  },
  exit: {
    scale: 0,
    transition: {
      type: "tween",
      ease: "easeIn",
    },
  },
};

export function Theme() {
  const [openModal, setOpenModal] = useState(false);
  const { isDarkMode } = useDarkMode();

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
            Icon={BsMoonStarsFill}
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
          Tema
        </span>
      </Dialog.Trigger>

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
          <AnimatePresence>
            {openModal && (
              <motion.div
                variants={modalVariants}
                initial="exit"
                animate="enter"
                exit="exit"
                className={cx("w-3/5 lg:w-2/5 shadow-xl", {
                  "bg-white": !isDarkMode,
                  "bg-gray-600": isDarkMode,
                })}
              >
                <ThemeContent
                  goBack={() => {
                    setOpenModal(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
