import cx from "classnames";
import { BsCheck, BsCheckAll, BsClock } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";

interface MessageStatusProps {
  status: "idle" | "read" | "received" | "send";
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  let icon = BsCheckAll;
  let label = "recibido";

  if (status === "idle") {
    icon = BsClock;
    label = "enviando";
  }

  if (status === "send") {
    icon = BsCheck;
    label = "enviado";
  }

  return (
    <CustomIcon
      icon={icon}
      label={`Mensaje ${label}`}
      className={cx(className, "inline-block", {
        "w-4 p-[1px]": status === "idle",
        "w-5": status !== "idle",
        "text-cyan-500": status === "read",
        "text-gray-400": status !== "read",
      })}
    />
  );
}
