import { useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";
import { DeleteMessage } from "./DeleteMessage";
import {
  MenuRoot,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import mc from "@/lib/utils/mergeClassnames";

export function Menu({
  id,
  onOpenChange,
}: {
  id: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

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
      <MenuTrigger
        className={mc("w-7 h-7 p-1")}
        icon={MoreVertical}
        label="Menu"
      />

      {open && (
        <MenuContent forceMount>
          <MenuItem disabled>Reenviar</MenuItem>
          <MenuItem>Reaccionar</MenuItem>
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
        msgId={id}
        open={openDeleteModal}
        openChange={setOpenDeleteModal}
      />
    </MenuRoot>
  );
}
