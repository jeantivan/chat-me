import { FaUserCircle } from "react-icons/fa";
import { CustomIcon } from "./CustomIcon";
import useStore from "@/lib/store";

export function UserImage() {
  const picture = useStore((state) => state.profile.picture);

  return !picture.medium ? (
    <CustomIcon
      label="Avatar"
      icon={FaUserCircle}
      className="w-full h-full text-gray-400"
    />
  ) : (
    <img
      alt="Tu foto de perfil."
      src={picture.medium}
      className="w-full h-full bg-gray-400"
    />
  );
}
