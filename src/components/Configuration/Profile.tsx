import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";
import { useDarkMode } from "../DarkMode";
import { useUserInfo } from "../UserInfoProvider";
import { EditableInput } from "../EditableInput";
import { ChangeUserImage } from "../ChangeUserImage";
import { CustomIcon } from "../CustomIcon";
import { useLeftDrawer } from "../LeftDrawer";
import { Header } from "./Header";

interface ProfileProps {
  goBack?: () => void;
}

export function Profile({ goBack }: ProfileProps) {
  const { closeLeftDrawer } = useLeftDrawer();
  const { mode } = useDarkMode();

  const { user, changeName, changeStatus } = useUserInfo();

  const handleSaveUserName = (newName: string) => {
    changeName(newName);
  };

  const handleSaveUserStatus = (newStatus: string) => {
    changeStatus(newStatus);
  };

  return (
    <>
      <Header goBack={goBack ? goBack : closeLeftDrawer}>Perfil</Header>
      <div className="py-6 overflow-y-auto">
        <div className="w-full flex justify-center mb-5">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "tween" }}
          >
            <ChangeUserImage />
          </motion.div>
        </div>
        <div className="p-6 ">
          <div className="mb-10">
            <EditableInput
              label="Nombre"
              value={user.name}
              onSave={handleSaveUserName}
            />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Este no es tu nombre de usuario ni un PIN. Este nombre será
              visible para tus contactos de ChatMe.
            </div>
          </div>
          <div className="mb-5">
            <EditableInput
              label="Estado"
              value={user.status}
              onSave={handleSaveUserStatus}
            />
          </div>
        </div>
      </div>
    </>
  );
}
