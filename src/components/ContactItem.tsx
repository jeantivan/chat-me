import mc from "@/lib/utils/mergeClassnames";
import { TUser } from "@/lib/types";
import { Label } from "./ui/Label";
import { Checkbox } from "./ui/Checkbox";

type BaseProps = { contact: TUser; className?: string };

type ContactItemProps = (
  | {
      selectable: true;
      checked: boolean;
      onCheckedChange: (checked: boolean | "indeterminate") => void;
    }
  | {
      selectable: false | undefined;
      checked?: undefined;
      onCheckedChange?: undefined;
    }
) &
  BaseProps;
export const ContactItem = ({
  contact,
  selectable,
  checked,
  onCheckedChange,
  className,
  ...rest
}: ContactItemProps) => {
  const Component = selectable ? Label : "div";
  return (
    <Component
      className={mc(
        "flex flex-row items-center select-none cursor-pointer p-2 gap-4 rounded-xl",
        "hover:bg-background-4",
        className
      )}
      {...rest}
      htmlFor={contact.id}
    >
      {typeof checked !== "undefined" && (
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          id={contact.id}
        />
      )}
      <div className="flex items-center">
        <div className="w-14 h-14">
          <img
            className="bg-background-3 w-full h-full overflow-hidden rounded-full"
            src={contact.picture}
            alt={`Foto de perfil de ${contact.name}`}
            loading="lazy"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="flex-1 text-lg truncate dark:text-background-12">
          {contact.name}
        </p>
        <p className="text-background-11 line-clamp-2 text-sm leading-tight">
          {contact.bio}
        </p>
      </div>
    </Component>
  );
};
