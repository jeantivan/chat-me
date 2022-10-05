import { FaUserCircle } from "react-icons/fa";
import { CustomIcon } from "./CustomIcon";
import useStore from "../store";

export function UserImage() {
  const picture = useStore((state) => state.profile.picture);

  return !picture.medium ? (
    <CustomIcon
      label="Avatar"
      Icon={FaUserCircle}
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