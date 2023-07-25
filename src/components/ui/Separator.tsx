import * as SeparatorPrimitive from "@radix-ui/react-separator";

export function Separator(props: SeparatorPrimitive.SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      {...props}
      decorative
      className="bg-gray-200 dark:bg-gray-600 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px"
    />
  );
}
