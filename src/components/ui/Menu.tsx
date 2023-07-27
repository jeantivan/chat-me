import { forwardRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IconButton } from "./IconButton";
import { LucideIcon } from "lucide-react";
import { CustomIcon } from "../CustomIcon";
import mc from "@/lib/utils/mergeClassnames";

export const MenuRoot = DropdownMenu.Root;
export const RadioGroup = DropdownMenu.RadioGroup;
export const RadioItem = DropdownMenu.RadioItem;
export const TriggerBase = DropdownMenu.Trigger;
export const Arrow = () => <DropdownMenu.Arrow className="fill-background-4" />;

type MenuTriggerProps = React.ComponentPropsWithRef<
  typeof DropdownMenu.Trigger
> & {
  icon: LucideIcon;
  label: string;
};
export const MenuTrigger = forwardRef<
  React.ElementRef<typeof DropdownMenu.Trigger>,
  MenuTriggerProps
>(function MenuTriggerBase({ className, ...rest }, ref) {
  return (
    <DropdownMenu.Trigger asChild>
      <IconButton
        className={mc("data-[state=open]:bg-background-6", className)}
        ref={ref}
        {...rest}
      />
    </DropdownMenu.Trigger>
  );
});

type MenuItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenu.Item
> & { icon?: LucideIcon };

export const MenuItem = forwardRef<
  React.ElementRef<typeof DropdownMenu.Item>,
  MenuItemProps
>(function MenuItemBase({ className, icon, children, ...rest }, ref) {
  const componentClassName = mc(
    "w-full px-4 py-2 rounded flex items-center gap-3",
    "outline-none cursor-pointer data-[disabled]:cursor-not-allowed",
    "hover:bg-background-6",
    "data-[disabled]:bg-background-3 data-[disabled]:text-background-11",
    "flex items-center",
    className
  );

  return (
    <DropdownMenu.Item ref={ref} className={componentClassName} {...rest}>
      {icon && (
        <CustomIcon className="w-5 h-5" icon={icon} label="Menu item icon" />
      )}
      {children}
    </DropdownMenu.Item>
  );
});

export const MenuContent = ({
  children,
  className,
  sideOffset = 4,
  align = "end",
  ...rest
}: DropdownMenu.MenuContentProps) => (
  <DropdownMenu.Content
    sideOffset={sideOffset}
    align={align}
    className={mc(
      "rounded p-1 shadow-md flex flex-col gap-1 min-w-[160px]",
      "bg-background-4 text-background-12",
      "z-50 select-none",
      className
    )}
    {...rest}
  >
    {children}
  </DropdownMenu.Content>
);
