import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import mc from "@/lib/utils/mergeClassnames";

export function Checkbox(props: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      className={mc(
        "flex h-5 w-5 min-w-[20px] items-center justify-center rounded border-2 transition",
        "border-background-9 bg-transparent",
        !props.disabled &&
          "data-[state=checked]:bg-primary-9 data-[state=checked]:border-primary-9",
        "disabled:bg-background-5",
        "focus:outline-none focus-visible:ring focus-visible:ring-primary-10 "
      )}
    >
      <CheckboxPrimitive.Indicator className="transition-all data-[disabled]:hidden">
        <Check className="h-[18px] w-[18px] self-center text-background-12" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
