import { motion } from "framer-motion";
import { Header } from "./Header";
import { EditableInput } from "@/components/EditableInput";
import { ChangeUserImage } from "@/components/ChangeUserImage";
import useStore from "@/lib/store";

export function Profile() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);

  const { name, bio } = useStore((state) => state.user);
  const { changeName, changeBio } = useStore((state) => ({
    changeName: state.changeName,
    changeBio: state.changeBio,
  }));

  const handleSaveUserName = (newName: string) => {
    changeName(newName);
  };

  const handleSaveUserStatus = (newBio: string) => {
    changeBio(newBio);
  };

  return (
    <>
      <Header goBack={closeLeftDrawer}>Perfil</Header>
      <div className="py-6 overflow-y-auto">
        <div className="w-full flex justify-center mb-5">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "tween", delay: 0.3 }}
          >
            <ChangeUserImage />
          </motion.div>
        </div>
        <div className="p-6 ">
          <div className="mb-10">
            <EditableInput
              label="Nombre"
              value={name}
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
              value={bio}
              onSave={handleSaveUserStatus}
            />
          </div>
        </div>
      </div>
    </>
  );
}
