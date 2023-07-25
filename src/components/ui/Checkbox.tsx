import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import mc from "@/lib/utils/mergeClassnames";

export function Checkbox(props: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      className={mc(
        "flex h-5 w-5 min-w-[20px] items-center justify-center rounded border-2 transition",
        "border-gray-400 bg-transparent",
        !props.disabled &&
          "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
        "disabled:bg-gray-400/80 dark:disabled:bg-gray-500",
        "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
      )}
    >
      <CheckboxPrimitive.Indicator className="transition-all data-[disabled]:hidden">
        <Check className="h-[18px] w-[18px] self-center text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
