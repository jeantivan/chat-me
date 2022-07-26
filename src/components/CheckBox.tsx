import cx from "classnames";
import { Root, Indicator } from "@radix-ui/react-checkbox";
import { BsCheck } from "react-icons/bs";

export function CheckBox(props: any) {
  return (
    <Root
      {...props}
      className={cx(
        "flex h-5 w-5 min-w-[20px] items-center justify-center rounded border-2",
        "radix-state-checked:bg-emerald-500 radix-state-checked:border-emerald-500",
        "radix-state-unchecked:border-gray-400 radix-state-unchecked:bg-transparent",
        "focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75"
      )}
    >
      <Indicator>
        <BsCheck className="h-5 w-5 self-center text-white" />
      </Indicator>
    </Root>
  );
}
