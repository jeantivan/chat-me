import { ReactNode, useState } from "react";
import { DeleteMessage } from "./DeleteMessage";
import {
  MenuRoot,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import { useUserId } from "@/lib/hooks";
import { useToggleStarMessage } from "@/lib/api/chatQueries";
import { TMessage } from "@/lib/types";
import { ForwardMessages } from "../ForwardMessages";

export function Menu({
  children,
  message,
  onOpenChange,
  align = "end",
}: {
  children: ReactNode;
  message: TMessage;
  align?: "start" | "end";
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [forwardMessagesDialog, setForwardMessagesDialog] = useState(false);

  const userId = useUserId();
  const isOwnMsg = message.owner === userId;
  const toggleStarServer = useToggleStarMessage();

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
      <MenuTrigger asChild>{children}</MenuTrigger>

      {open && (
        <MenuContent align={align} forceMount>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setForwardMessagesDialog(true);
            }}
          >
            Reenviar
          </MenuItem>
          <MenuItem
            onClick={() => {
              toggleStarServer(message.id, message.chatId);
            }}
          >
            {message.starred ? "No destacar" : "Destacar"}
          </MenuItem>
          {isOwnMsg && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialog(true);
              }}
            >
              Eliminar
            </MenuItem>
          )}
        </MenuContent>
      )}
      <DeleteMessage
        message={message}
        open={deleteDialog}
        openChange={setDeleteDialog}
      />
      <ForwardMessages
        messages={[message]}
        open={forwardMessagesDialog}
        openChange={setForwardMessagesDialog}
      />
    </MenuRoot>
  );
}
