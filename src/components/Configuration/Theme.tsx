import * as RadioGroup from "@radix-ui/react-radio-group";
import { Moon, Sun } from "lucide-react";
import { Header } from "./Header";

import mc from "@/lib/utils/mergeClassnames";
import useStore from "@/lib/store";
import { useTheme } from "@/lib/hooks";
import { TTheme } from "@/lib/types";

type Option = { name: string; bg: string };
const options: Record<TTheme["colors"], Option> = {
  "slate-indigo": { name: "Indigo", bg: "bg-[#3e63dd]" },
  "slate-sky": { name: "Sky", bg: "bg-[#68ddfd]" },
  "sage-teal": { name: "Teal", bg: "bg-[#12a594]" },
  "olive-grass": { name: "Grass", bg: "bg-[#46a758]" },
  "gold-lime": { name: "Lime", bg: "bg-[#99D52A]" },
  "sand-yellow": { name: "Yellow", bg: "bg-[#f5d90a]" },
  "sand-orange": { name: "Orange", bg: "bg-[#f76808]" },
  "mauve-crimson": { name: "Crimson", bg: "bg-[#e93d82]" },
  "mauve-violet": { name: "Violet", bg: "bg-[#6e56cf]" },
};

type ColorItemProps = RadioGroup.RadioGroupItemProps & { option: Option };
const ColorItem = (props: ColorItemProps) => (
  <RadioGroup.Item
    {...props}
    className={mc(
      "shrink-0 grow w-[calc(30%-1rem)] p-1 inline-flex flex-col items-center gap-0.5",
      "text-sm leading-none text-background-11",
      "border rounded",
      "border-background-6 data-[state=checked]:border-primary-7"
    )}
  >
    <span
      className={mc("w-full h-10 inline-block rounded-sm", props.option.bg)}
    />
    <span>{props.option.name}</span>
  </RadioGroup.Item>
);

const ModeItem = (props: RadioGroup.RadioGroupItemProps) => {
  return (
    <RadioGroup.Item
      {...props}
      className={mc(
        "flex-1 flex items-center justify-center gap-3 py-1.5 px-3 text-background-12",
        "first:rounded-l last:rounded-r border border-background-7",
        "data-[state=checked]:text-primary-11 data-[state=checked]:border-primary-8"
      )}
    />
  );
};

export function Theme() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  const { colors, mode, changeThemeColors, changeThemeMode } = useTheme();

  return (
    <>
      <Header goBack={closeLeftDrawer}>Personalizar interfaz</Header>
      <div className="overflow-y-auto flex-1 bg-background-1 flex flex-col p-4">
        <div className="mb-5">
          <p className="text-primary-10 mb-4">Color principal</p>
          <RadioGroup.Root
            className="w-full flex flex-wrap justify-between gap-4"
            value={colors}
            onValueChange={(newValue) => {
              changeThemeColors(newValue as typeof colors);
            }}
          >
            {(Object.keys(options) as Array<TTheme["colors"]>).map((option) => (
              <ColorItem key={option} value={option} option={options[option]} />
            ))}
          </RadioGroup.Root>
        </div>
        <div className="mb-5">
          <p className="text-primary-10 mb-4">Modo</p>
          <RadioGroup.Root
            value={mode}
            onValueChange={(newValue) => {
              changeThemeMode(newValue as typeof mode);
            }}
            className="flex"
          >
            <ModeItem value="light">
              <Sun className="w-4 h-4" /> Claro
            </ModeItem>
            <ModeItem value="dark">
              <Moon className="w-4 h-4" />
              Oscuro
            </ModeItem>
          </RadioGroup.Root>
        </div>
      </div>
    </>
  );
}
