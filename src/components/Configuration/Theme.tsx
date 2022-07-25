import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Label from "@radix-ui/react-label";
import cx from "classnames";
import { useState } from "react";

import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";
import { useDarkMode } from "../DarkMode";
import { CustomIcon } from "../CustomIcon";
import { Header } from "./Header";

interface ThemeProps {
  goBack: () => void;
}

export function Theme({ goBack }: ThemeProps) {
  const { mode, setDarkMode } = useDarkMode();
  const [value, setValue] = useState(mode);

  const handleOk = () => {
    if (value !== "light" && value !== "dark") return;
    setDarkMode(value);
    return goBack();
  };

  return (
    <>
      <Header goBack={goBack}>Elegir Tema</Header>
      <div className="py-6 flex flex-col">
        <div className="w-4/5 mx-auto mb-10">
          <RadioGroup.Root
            defaultValue={mode}
            aria-label="Elegir tema"
            className="flex flex-col justify-center"
            value={value}
            onValueChange={setValue}
          >
            <div className="flex mb-5 items-center">
              <RadioGroup.Item
                value="light"
                id="light"
                className={cx(
                  "w-5 h-5 bg-white rounded-full mr-5",
                  "inline-flex items-center justify-center",
                  { "border shadow-sm": mode === "light" }
                )}
              >
                <RadioGroup.Indicator className="bg-emerald-500 w-2.5 h-2.5 rounded-full" />
              </RadioGroup.Item>
              <Label.Root
                htmlFor="light"
                className={`text-medium ${
                  mode === "light" ? "text-black" : "text-white"
                }`}
              >
                Claro
              </Label.Root>
            </div>

            <div className="flex mb-5 items-center">
              <RadioGroup.Item
                value="dark"
                id="dark"
                className={cx(
                  "w-5 h-5 bg-white rounded-full mr-5",
                  "inline-flex items-center justify-center",
                  { "border shadow-sm": mode === "light" }
                )}
              >
                <RadioGroup.Indicator className="bg-emerald-500 w-2.5 h-2.5 rounded-full" />
              </RadioGroup.Item>
              <Label.Root
                htmlFor="dark"
                className={`text-medium ${
                  mode === "light" ? "text-black" : "text-white"
                }`}
              >
                Oscuro
              </Label.Root>
            </div>
          </RadioGroup.Root>
        </div>
        <div className="w-4/5 mx-auto flex justify-end">
          <button
            onClick={() => goBack()}
            className="mr-2 py-2 px-4 rounded-md inline-flex justify-center uppercase border-solid border border-emerald-600/40 hover:bg-white/5 text-emerald-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleOk}
            className="py-2 px-4 rounded-md inline-flex justify-center uppercase bg-emerald-600 hover:bg-emerald-600/80  text-white"
          >
            Ok
          </button>
        </div>
      </div>
    </>
  );
}
