import { FaUserCircle } from "react-icons/fa";
import { useUserInfo } from "./UserInfoProvider";

export function UserImage() {
  const { user } = useUserInfo();

  return user.picture ? (
    <img
      alt="Tu foto de perfil."
      src={user.picture}
      className="w-full h-full bg-gray-400"
    />
  ) : (
    <span className="w-full h-full text-gray-400">
      <FaUserCircle className="w-full h-full" />
    </span>
  );
}
