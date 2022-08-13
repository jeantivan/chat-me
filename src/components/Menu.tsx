import * as Popover from "@radix-ui/react-popover";
import cx from "classnames";
import { CustomIcon } from "./CustomIcon";
import { IconType } from "react-icons";

export const MenuRoot = Popover.Root;

export const MenuTrigger = Popover.Trigger;

export const MenuItem = ({
  className,
  children,
  onClick,
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => any;
}) => {
  const componentClassName = cx(
    "w-full px-4 py-2",
    "dark:text-white hover:bg-neutral-200 dark:hover:bg-gray-800",
    "flex items-center",
    className
  );

  if (onClick) {
    return (
      <li>
        <button {...rest} onClick={onClick} className={componentClassName}>
          {children}
        </button>
      </li>
    );
  }

  return (
    <li className={componentClassName} {...rest}>
      {children}
    </li>
  );
};

export const MenuIcon = ({
  label,
  isDanger,
  Icon,
  className,
  ...rest
}: {
  label: string;
  isDanger?: boolean;
  Icon: IconType;
  className?: string;
}) => (
  <span
    className={cx(
      "w-6",
      {
        "text-neutral-700 dark:text-neutral-50": !isDanger,
        "text-red-500 dark:text-red-600": isDanger,
      },
      className
    )}
    {...rest}
  >
    <CustomIcon Icon={Icon} label={label} />
  </span>
);

export const MenuContent = ({
  children,
  className,
  sideOffset = 4,
  align,
  ...rest
}: {
  children: Array<React.ReactNode>;
  className?: string;
  sideOffset?: number;
  align?: "start" | "center" | "end";
}) => (
  <Popover.Content
    sideOffset={sideOffset}
    align={align}
    className={cx(
      "rounded py-2 shadow-md",
      "bg-white dark:bg-gray-700",
      "z-50 select-none",
      className
    )}
    {...rest}
  >
    <ul>{children}</ul>
  </Popover.Content>
);
