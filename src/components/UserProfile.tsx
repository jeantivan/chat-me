import { Edit } from "lucide-react";
import { UserImage } from "./UserImage";
import { ShowMoreMenu } from "./ShowMoreMenu";
import { IconButton } from "./ui/IconButton";
import useStore from "@/lib/store";

export function UserProfile() {
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);

  return (
    <div className="user-profile bg-white dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 px-3 py-2 flex">
      <div className="flex items-center flex-1">
        <button
          onClick={() => {
            leftDrawerGoTo("PROFILE");
          }}
          className="w-10 h-10 overflow-hidden rounded-full"
        >
          <UserImage />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <IconButton
          icon={Edit}
          label="Nuevo chat"
          onClick={() => {
            leftDrawerGoTo("NEW_CHAT");
          }}
        />
        <ShowMoreMenu />
      </div>
    </div>
  );
}
