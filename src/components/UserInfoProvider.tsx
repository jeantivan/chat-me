import { createContext, useContext, useState, useEffect } from "react";
import { USER_PROFILE_KEY, INITIAL_USER } from "../utils/constants";
import { changeLocalStorageUserInfo } from "../utils/changeLocalStorageUserInfo";
import { UserType } from "../types";

interface UserInfoInterface {
  user: UserType;
  changeName: (newName: string) => void;
  changeStatus: (newStatus: string) => void;
  changePicture: (newPicture: string) => void;
}

export const UserInfoContext = createContext<UserInfoInterface>(
  {} as UserInfoInterface
);

const getInitialUser = (): UserType => {
  if (!localStorage.getItem(USER_PROFILE_KEY)) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(INITIAL_USER));
  }

  return JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || "");
};

export const useUserInfo = () => useContext(UserInfoContext);

export function UserInfoProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(getInitialUser());

  const changeName = (newName: string) => {
    if (changeLocalStorageUserInfo("name", newName)) {
      setUser({ ...user, name: newName });
    }
  };

  const changeStatus = (newStatus: string) => {
    if (changeLocalStorageUserInfo("status", newStatus)) {
      setUser({ ...user, status: newStatus });
    }
  };

  const changePicture = (newPicture: string) => {
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
