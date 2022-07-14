import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";
import { useDarkMode } from "../DarkMode";
import { useUserInfo } from "../UserInfoProvider";
import { EditableInput } from "../EditableInput";
import { ChangeUserImage } from "../ChangeUserImage";
import { CustomIcon } from "../CustomIcon";
import { useLeftDrawer } from "../LeftDrawer";

export function Profile({ goBack }) {
  const { closeLeftDrawer } = useLeftDrawer();
  const { mode } = useDarkMode();

  const { user, changeName, changeStatus } = useUserInfo();

  const handleSaveUserName = (newName) => {
    changeName(newName);
  };

  const handleSaveUserStatus = (newStatus) => {
    changeStatus(newStatus);
  };

  return (
    <>
      <header className="pt-16 bg-slate-700 pb-5 ">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: "tween" }}
          className="px-4 flex items-center"
        >
          <button
            onClick={goBack ? goBack : closeLeftDrawer}
            className="w-7 h-7 dark:text-slate-400 text-slate-500 hover:text-slate-400 mr-4"
          >
            <CustomIcon Icon={BsArrowLeft} label="Cerrar configuración" />
          </button>

          <h2 id="left-drawer-title" className="text-slate-50 text-xl">
            Perfil
          </h2>
        </motion.div>
      </header>
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
            <div
              className={`text-sm ${
                mode === "light" ? "text-gray-500" : "text-gray-400"
              }`}
            >
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
