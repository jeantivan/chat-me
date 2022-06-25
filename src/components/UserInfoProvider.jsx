import { createContext, useContext, useState } from "react";

const INITIAL_USER = {
  name: "Jane Doe",
  status: "Hola estoy usando ChatMe!",
  picture: "",
};
export const UserInfoContext = createContext({
  ...INITIAL_USER,
  changeName: () => {},
  changeStatus: () => {},
  changePicture: () => {},
});

export const useUserInfo = () => useContext(UserInfoContext);

export function UserInfoProvider({ children }) {
  const [userInfo, setUserInfo] = useState(INITIAL_USER);

  const changeName = (newName) => {
    setUserInfo({ ...userInfo, name: newName });
  };

  const changeStatus = (newStatus) => {
    setUserInfo({ ...userInfo, status: newStatus });
  };

  const changePicture = (newPicture) => {
    setUserInfo({ ...userInfo, picture: newPicture });
  };

  return (
    <UserInfoContext.Provider
      value={{ ...userInfo, changeName, changeStatus, changePicture }}
    >
      {children}
    </UserInfoContext.Provider>
  );
}
