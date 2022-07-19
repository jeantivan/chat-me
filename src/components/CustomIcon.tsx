import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { IconType } from "react-icons";

interface CustomIconProps {
  label: string;
  Icon: IconType;
  iconClassName?: string;
  className?: string;
}

export function CustomIcon({
  label,
  Icon,
  iconClassName,
  className,
  ...rest
}: CustomIconProps) {
  return (
    <span className={className} {...rest}>
      <AccessibleIcon.Root label={`Icono ${label}`}>
        <Icon className={`w-full h-full text-inherit ${iconClassName}`} />
      </AccessibleIcon.Root>
    </span>
  );
}
