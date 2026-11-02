import { Button } from "@/components/ui/Button";
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/AlertDialog";
import { useDeleteChat } from "@/lib/api/chatQueries";

type DeleteChatDialogProps = {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteChatDialog({
  chatId,
  open,
  onOpenChange,
}: DeleteChatDialogProps) {
  const deleteChatMutation = useDeleteChat();

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent open={open}>
        <div className="p-6">
          <div className="mb-4">
            <AlertDialogTitle className="text-xl font-light">
              ¿Eliminar este chat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-background-11 mt-2">
              Se eliminará el historial de este chat y no aparecerá en tu lista de chats.
            </AlertDialogDescription>
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
                data-testid="confirm-delete-chat-button"
                onClick={() => {
                  deleteChatMutation.mutate(chatId);
                }}
              >
                Eliminar chat
              </Button>
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
}
