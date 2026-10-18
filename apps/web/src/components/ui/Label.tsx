import * as LabelPrimitive from "@radix-ui/react-label";
import mc from "@/lib/utils/mergeClassnames";

export function Label(
  props: LabelPrimitive.LabelProps & { disabled?: boolean }
) {
  return (
    <LabelPrimitive.Root
      {...props}
      className={mc(
        "flex-1 inline-flex flex-col select-none text-base",
        "text-gray-900 dark:text-gray-100",
        props.disabled && "text-gray-500 dark:text-gray-500",
        props.className
      )}
    />
  );
}
