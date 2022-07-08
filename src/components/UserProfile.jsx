import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BsPlusCircle, BsChatLeftTextFill } from "react-icons/bs";
import { UserMenu } from "./UserMenu";
import { UserImage } from "./UserImage";
import { useDarkMode } from "./DarkMode";
import { Drawer } from "./Drawer";
import { Profile } from "./Configuration/Profile";
import { CustomIcon } from "./CustomIcon";

export function UserProfile() {
  const { mode } = useDarkMode();
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="user-profile dark:bg-slate-800 bg-zinc-50 border-solid border-r border-b border-slate-200 dark:border-slate-600 px-3 py-2 flex">
      <Dialog.Root open={openModal} onOpenChange={setOpenModal}>
        <div className="flex items-center flex-1">
          <Dialog.Trigger asChild>
            <div className="cursor-pointer text-gray-400 w-10 h-10 overflow-hidden rounded-full mr-3">
              <UserImage />
            </div>
          </Dialog.Trigger>
        </div>
        <Drawer from="left" open={openModal}>
          <div
            className={`${
              mode === "light" ? "bg-white" : "bg-slate-800"
            } w-full h-full flex flex-col`}
          >
            <Profile
              goBack={() => {
                setOpenModal(false);
              }}
            />
          </div>
        </Drawer>
      </Dialog.Root>

      <div className="flex items-center">
        <div className="h-8 w-8 ml-2 rounded-full p-1 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer">
          <CustomIcon
            Icon={BsPlusCircle}
            label="Historias"
            className="dark:text-gray-400 text-gray-500 "
          />
        </div>
        <div className="h-8 w-8 ml-2 rounded-full p-2 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer">
          <CustomIcon
            Icon={BsChatLeftTextFill}
            label="Nuevo chat"
            className="dark:text-gray-400 text-gray-500 "
          />
        </div>
        <div className="ml-2">
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
