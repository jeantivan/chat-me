import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { DeleteMessage } from "./DeleteMessage";
import {
  MenuRoot,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import useStore from "@/lib/store";
import mc from "@/lib/utils/mergeClassnames";

export function Menu({
  id,
  isFavMsg,
  onOpenChange,
  align = "end",
}: {
  id: string;
  isFavMsg?: boolean;
  align?: "start" | "end";
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const currentChatId = useStore((state) => state.currentChatId);
  const toggleFavMessage = useStore((state) => state.toggleFavMessage);

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
        <MenuContent align={align} forceMount>
          <MenuItem disabled>Reenviar</MenuItem>
          <MenuItem
            onClick={() => {
              toggleFavMessage(id, currentChatId!);
            }}
          >
            {isFavMsg ? "No destacar" : "Destacar"}
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
        msgId={id}
        open={openDeleteModal}
        openChange={setOpenDeleteModal}
      />
    </MenuRoot>
  );
}
