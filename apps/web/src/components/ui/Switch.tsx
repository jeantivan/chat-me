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
        "bg-background-5 data-[state=checked]:bg-primary-9",
        "relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "focus:outline-none focus-visible:ring focus-visible:ring-primary-10"
      )}
    >
      <PrimitiveSwitch.Thumb
        className={mc(
          "data-[state=checked]:translate-x-5 translate-x-0",
          "pointer-events-none inline-block h-[20px] w-[20px] p-1 transform rounded-full bg-background-12 ring-0 transition duration-200 ease-in-out"
        )}
      ></PrimitiveSwitch.Thumb>
    </PrimitiveSwitch.Root>
  );
}
