import { Button } from "@/components/ui/Button";
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { useDeleteMessage } from "@/lib/api/chatQueries";
import { TMessage } from "@/lib/types";

type DeleteMessageProps = {
  open: boolean;
  openChange: (open: boolean) => void;
  message: TMessage;
};

export function DeleteMessage({
  message,
  open,
  openChange,
}: DeleteMessageProps) {
  const deleteMessageServer = useDeleteMessage();

  return (
    <AlertDialogRoot open={open} onOpenChange={openChange}>
      <AlertDialogContent open={open}>
        <div className="p-6">
          <div className="mb-10">
            <AlertDialogTitle className="text-xl font-light">
              ¿Deseas eliminar este mensaje?
            </AlertDialogTitle>
          </div>
          <div className="w-full flex gap-4 justify-end mt-8">
            <AlertDialogCancel asChild>
              <Button variant="outlined" className="outline-none">
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="filled"
                onClick={() => {
                  deleteMessageServer(message.id, message.chatId);
                }}
              >
                Eliminar mensaje
              </Button>
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
}
