import { createContext, useContext, useState } from "react";

const INITIAL_USER = {
  name: "Jane Doe",
  status: "Hola estoy usando ChatMe!",
  picture: "",
};
export const UserInfoContext = createContext({
  user: INITIAL_USER,
  changeName: () => {},
  changeStatus: () => {},
  changePicture: () => {},
});

export const useUserInfo = () => useContext(UserInfoContext);

export function UserInfoProvider({ children }) {
  const [user, setUser] = useState(INITIAL_USER);

  const changeName = (newName) => {
    setUser({ ...user, name: newName });
  };

  const changeStatus = (newStatus) => {
    setUser({ ...user, status: newStatus });
  };

  const changePicture = (newPicture) => {
    setUser({ ...user, picture: newPicture });
  };

  return (
    <UserInfoContext.Provider
      value={{ user, changeName, changeStatus, changePicture }}
    >
      {children}
    </UserInfoContext.Provider>
  );
}
