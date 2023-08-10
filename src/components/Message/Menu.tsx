import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { DeleteMessage } from "./DeleteMessage";
import { IconButton } from "@/components/ui/IconButton";
import {
  MenuRoot,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import useStore from "@/lib/store";
import { TMessage } from "@/lib/types";

export function Menu({
  message,
  onOpenChange,
  align = "end",
}: {
  message: TMessage;
  align?: "start" | "end";
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const starMessage = useStore((state) => state.starMessage);

  return (
    <MenuRoot
      open={open}
      onOpenChange={(newValue) => {
        setOpen(newValue);
        if (onOpenChange) {
          onOpenChange(newValue);
        }
      }}
    >
      <MenuTrigger asChild>
        <IconButton className="w-7 h-7 p-1" icon={MoreVertical} label="Menu" />
      </MenuTrigger>

      {open && (
        <MenuContent align={align} forceMount>
          <MenuItem disabled>Reenviar</MenuItem>
          <MenuItem
            onClick={() => {
              starMessage(message);
            }}
          >
            {message.starred ? "No destacar" : "Destacar"}
          </MenuItem>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setOpenDeleteModal(true);
            }}
          >
            Eliminar
          </MenuItem>
        </MenuContent>
      )}
      <DeleteMessage
        message={message}
        open={openDeleteModal}
        openChange={setOpenDeleteModal}
      />
    </MenuRoot>
  );
}
