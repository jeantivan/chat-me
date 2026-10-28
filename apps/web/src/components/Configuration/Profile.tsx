import { motion } from "framer-motion";
import { EditableInput } from "@/components/EditableInput";
import { ChangeUserImage } from "@/components/ChangeUserImage";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";
import { useUserProfile, useUpdateProfile } from "@/lib/api/profileQueries";

export function Profile() {
  const { data: userProfile } = useUserProfile();
  const zustandUser = useStore((state) => state.user);
  const name = userProfile?.name ?? zustandUser.name;
  const bio = userProfile?.bio ?? zustandUser.bio;

  const updateProfile = useUpdateProfile();

  const handleSaveUserName = (newName: string) => {
    updateProfile.mutate({ name: newName.trim() });
  };

  const handleSaveUserStatus = (newBio: string) => {
    updateProfile.mutate({ bio: newBio });
  };

  return (
    <ScrollArea type="auto" className="py-6">
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
            maxLength={100}
            required
            onSave={handleSaveUserName}
          />
          <div className="text-sm text-background-11">
            Este no es tu nombre de usuario ni un PIN. Este nombre será visible
            para tus contactos de ChatMe.
          </div>
        </div>
        <div className="mb-5">
          <EditableInput
            label="Estado"
            value={bio}
            maxLength={500}
            onSave={handleSaveUserStatus}
          />
        </div>
      </div>
    </ScrollArea>
  );
}
