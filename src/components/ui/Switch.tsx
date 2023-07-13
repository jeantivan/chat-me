import * as PrimitiveSwitch from "@radix-ui/react-switch";
import mc from "@/lib/utils/mergeClassnames";

type SwitchType = React.ComponentPropsWithoutRef<typeof PrimitiveSwitch.Root>;

export function Switch({
  children,
  ...rest
}: { children?: React.ReactNode } & SwitchType) {
  return (
    <PrimitiveSwitch.Root
      {...rest}
      className={mc(
        "group",
        "dark:bg-slate-300 data-[state=checked]:bg-emerald-600",
        "dark:bg-slate-700  dark:data-[state=checked]:bg-emerald-500",
        "relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
      )}
    >
      <PrimitiveSwitch.Thumb
        className={mc(
          "data-[state=checked]:translate-x-5 translate-x-0",
          "pointer-events-none inline-block h-[20px] w-[20px] p-1 transform rounded-full text-neutral-700 bg-white ring-0 transition duration-200 ease-in-out"
        )}
      ></PrimitiveSwitch.Thumb>
    </PrimitiveSwitch.Root>
  );
}
