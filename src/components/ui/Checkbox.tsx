import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import mc from "@/lib/utils/mergeClassnames";

export function Checkbox(props: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      className={mc(
        "flex h-5 w-5 min-w-[20px] items-center justify-center rounded border-2",
        "border-gray-400 bg-transparent",
        "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
        "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="h-[18px] w-[18px] self-center text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
