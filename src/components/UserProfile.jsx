// import { useState } from "react";
// import * as Dialog from "@radix-ui/react-dialog";
import { BsPlusCircle, BsChatLeftTextFill } from "react-icons/bs";
import { UserMenu } from "./UserMenu";
import { UserImage } from "./UserImage";
// import { useDarkMode } from "./DarkMode";
// import { Drawer } from "./Drawer";
// import { Profile } from "./Configuration/Profile";
import { CustomIcon } from "./CustomIcon";
import { useLeftDrawer } from "./LeftDrawer";

export function UserProfile() {
  const { openLeftDrawerAndRenderContent } = useLeftDrawer();

  return (
    <div className="user-profile dark:bg-slate-800 bg-zinc-50 border-solid border-r border-b border-slate-200 dark:border-slate-600 px-3 py-2 flex">
      <div className="flex items-center flex-1">
        <button
          onClick={() => {
            openLeftDrawerAndRenderContent("USER_PROFILE");
          }}
          className="w-10 h-10 overflow-hidden rounded-full mr-3"
        >
          <UserImage />
        </button>
      </div>

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
