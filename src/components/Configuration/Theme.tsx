import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Label from "@radix-ui/react-label";
import cx from "classnames";
import { ReactNode, useState } from "react";
import { MoonStar } from "lucide-react";
import { useDarkMode } from "@/components/DarkMode";
import { CustomIcon } from "@/components/CustomIcon";
import {
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogContent,
} from "@/components/Dialog";

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
      <DialogTitle
        className={cx("text-xl mb-5", {
          "text-neutral-900": !isDarkMode,
          "text-neutral-50": isDarkMode,
        })}
      >
        Elegir Tema
      </DialogTitle>
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

export function Theme() {
  const [openModal, setOpenModal] = useState(false);
  const { isDarkMode } = useDarkMode();

  return (
    <DialogRoot open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger
        className={`w-full flex items-center ${
          !isDarkMode ? "hover:bg-slate-50" : "hover:bg-slate-700"
        }`}
      >
        <span className="w-20 flex items-center justify-center">
          <CustomIcon
            label="Atajos del teclado"
            icon={MoonStar}
            className="w-6 h-6 text-slate-400"
          />
        </span>
        <span
          className={`py-5 pr-4 flex-1 border-b text-left text-lg font-medium ${
            !isDarkMode
              ? "text-black border-slate-200"
              : "text-slate-50 border-slate-700 "
          }`}
        >
          Tema
        </span>
      </DialogTrigger>
      <DialogContent className="w-[60%] md:w-[50%] lg:w-[40%]" open={openModal}>
        <ThemeContent
          goBack={() => {
            setOpenModal(false);
          }}
        />
      </DialogContent>
    </DialogRoot>
  );
}
