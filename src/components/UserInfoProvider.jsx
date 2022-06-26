import { createContext, useContext, useState, useEffect } from "react";
import { USER_PROFILE_KEY, INITIAL_USER } from "../utils/constants";
import { changeLocalStorageUserInfo } from "../utils/changeLocalStorageUserInfo";

export const UserInfoContext = createContext({
  user: INITIAL_USER,
  changeName: () => {},
  changeStatus: () => {},
  changePicture: () => {},
});

export const useUserInfo = () => useContext(UserInfoContext);

export function UserInfoProvider({ children }) {
  const [user, setUser] = useState(INITIAL_USER);

  useEffect(() => {
    if (!localStorage.getItem(USER_PROFILE_KEY)) {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(INITIAL_USER));
    }
  });

  const changeName = (newName) => {
    if (changeLocalStorageUserInfo("name", newName)) {
      setUser({ ...user, name: newName });
    }
  };

  const changeStatus = (newStatus) => {
    if (changeLocalStorageUserInfo("status", newStatus)) {
      setUser({ ...user, status: newStatus });
    }
  };

  const changePicture = (newPicture) => {
    if (changeLocalStorageUserInfo("picture", newPicture)) {
      setUser({ ...user, picture: newPicture });
    }
  };

  return (
    <UserInfoContext.Provider
      value={{ user, changeName, changeStatus, changePicture }}
    >
      {children}
    </UserInfoContext.Provider>
  );
}
