import { Button } from "@/components/ui/Button";
import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/AlertDialog";
import { useClearChat } from "@/lib/api/chatQueries";

type ClearChatDialogProps = {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClearChatDialog({
  chatId,
  open,
  onOpenChange,
}: ClearChatDialogProps) {
  const clearChatMutation = useClearChat();

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent open={open}>
        <div className="p-6">
          <div className="mb-4">
            <AlertDialogTitle className="text-xl font-light">
              ¿Vaciar este chat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-background-11 mt-2">
              Se borrarán los mensajes de este chat para ti. Los demás participantes mantendrán su historial.
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
                data-testid="confirm-clear-chat-button"
                onClick={() => {
                  clearChatMutation.mutate(chatId);
                }}
              >
                Vaciar chat
              </Button>
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
}
