import cx from "classnames";
import { ReactNode, useState } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogDescription,
} from "../AlertDialog";
import { MenuItem } from "../Menu";
import { useDarkMode } from "../DarkMode";
import useStore from "../../store";

const Button: React.FC<{
  children: ReactNode;
  type?: "filled" | "outlined";
  [x: string]: any;
}> = ({ children, type = "filled", ...rest }) => (
  <button
    {...rest}
    className={cx(
      "mr-2 py-2 px-6 min-w-[64px] rounded inline-flex justify-center uppercase font-medium border-solid border",
      {
        "border-emerald-400/40 hover:bg-white/5 text-emerald-400":
          type === "outlined",
      },
      {
        "bg-emerald-500 hover:bg-emerald-400 border-emerald-500 hover:border-emerald-400 text-white":
          type === "filled",
      }
    )}
  >
    {children}
  </button>
);

interface DeleteMessageProps {
  msgId: string;
}

export function DeleteMessage({ msgId }: DeleteMessageProps) {
  const { isDarkMode } = useDarkMode();
  const [openModal, setOpenModal] = useState(false);
  const deleteMessage = useStore((state) => state.deleteMessage);
  const currentChatId = useStore((state) => state.currentChatId);

  return (
    <AlertDialogRoot open={openModal} onOpenChange={setOpenModal}>
      <AlertDialogTrigger asChild>
        <MenuItem>Eliminar Mensaje</MenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent
        open={openModal}
        className="w-[60%] md:w-[50%] lg:w-[40%]"
      >
        <div className="p-6">
          <VisuallyHidden.Root>
            <AlertDialogTitle>Eliminar mensaje</AlertDialogTitle>
          </VisuallyHidden.Root>
          <div className="mb-6">
            <AlertDialogDescription
              className={cx("text-xl font-light", {
                "text-neutral-900": !isDarkMode,
                "text-neutral-50": isDarkMode,
              })}
            >
              ¿Deseas eliminar este mensaje?
            </AlertDialogDescription>
          </div>
          <div className="w-full flex justify-end mt-8">
            <AlertDialogCancel asChild>
              <Button type="outlined">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="filled"
                onClick={() => {
                  deleteMessage(msgId, currentChatId!);
                }}
                className="py-2 px-4 rounded-md inline-flex justify-center uppercase"
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
