import { FaUserCircle } from "react-icons/fa";
import { useUserInfo } from "./UserInfoProvider";
import { CustomIcon } from "./CustomIcon";

export function UserImage() {
  const { user } = useUserInfo();

  return user.picture ? (
    <img
      alt="Tu foto de perfil."
      src={user.picture}
      className="w-full h-full bg-gray-400"
    />
  ) : (
    <CustomIcon
      label="Avatar"
      Icon={FaUserCircle}
      className="w-full h-full text-gray-400"
    />
  );
}
