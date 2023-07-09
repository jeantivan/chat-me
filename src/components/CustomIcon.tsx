import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import cx from "classnames";
import { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";

interface CustomIconProps {
  label: string;
  icon: IconType | LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function CustomIcon({
  label,
  icon,
  iconClassName,
  className,
  ...rest
}: CustomIconProps) {
  const Icon = icon || "svg";
  return (
    <span className={className} {...rest}>
      <AccessibleIcon.Root label={`Icono ${label}`}>
        <Icon className={cx("w-full h-full", iconClassName)} />
      </AccessibleIcon.Root>
    </span>
  );
}
