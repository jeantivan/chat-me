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
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
  const deleteChatMutation = useDeleteChat();

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent open={open}>
        <div className="p-6">
          <div className="mb-4">
            <AlertDialogTitle className="text-xl font-light">
              {t("chat.deleteChatDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-background-11 mt-2">
              {t("chat.deleteChatDialogDescription")}
            </AlertDialogDescription>
          </div>
          <div className="w-full flex gap-4 justify-end mt-8">
            <AlertDialogCancel asChild>
              <Button variant="outlined" className="outline-none">
                {t("common.cancel")}
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
                {t("chat.deleteChat")}
              </Button>
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
}
