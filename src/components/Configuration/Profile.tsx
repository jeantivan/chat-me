import { motion } from "framer-motion";
import { EditableInput } from "../EditableInput";
import { ChangeUserImage } from "../ChangeUserImage";
import { useLeftDrawer } from "../LeftDrawer";
import { Header } from "./Header";
import { AnimateOptionChange } from "./AnimateOptionChange";
import useStore from "../../store";

interface ProfileProps {
  goBack?: () => void;
  isNotAnimated?: boolean;
}

export function Profile({ goBack, isNotAnimated }: ProfileProps) {
  const { closeLeftDrawer } = useLeftDrawer();

  const { name, status } = useStore((state) => state.profile);
  const { changeName, changeStatus } = useStore((state) => ({
    changeName: state.changeName,
    changeStatus: state.changeStatus,
  }));

  const handleSaveUserName = (newName: string) => {
    changeName(newName);
  };

  const handleSaveUserStatus = (newStatus: string) => {
    changeStatus(newStatus);
  };

  return (
    <AnimateOptionChange isNotAnimated={isNotAnimated}>
      <Header goBack={goBack ? goBack : closeLeftDrawer}>Perfil</Header>
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
              value={status}
              onSave={handleSaveUserStatus}
            />
          </div>
        </div>
      </div>
    </AnimateOptionChange>
  );
}
