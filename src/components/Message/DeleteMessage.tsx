import { Button } from "@/components/ui/Button";
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import useStore from "@/lib/store";

interface DeleteMessageProps {
  open: boolean;
  openChange: (open: boolean) => void;
  msgId: string;
}

export function DeleteMessage({ msgId, open, openChange }: DeleteMessageProps) {
  const deleteMessage = useStore((state) => state.deleteMessage);
  const currentChatId = useStore((state) => state.currentChatId);

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
                  deleteMessage(msgId, currentChatId!);
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
