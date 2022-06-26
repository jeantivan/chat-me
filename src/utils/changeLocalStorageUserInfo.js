import { USER_PROFILE_KEY, INITIAL_USER } from "./constants";

export const changeLocalStorageUserInfo = (property, newValue) => {
  // Si la propiedad no existe en el objecto del localStorage
  if (!(property in Object.entries(INITIAL_USER))) {
    console.error(`The property ${property} does not exist in localStorage`);
    return false;
  }

  // Obtiene el valor actual de la información del usuario en el localStorage
  const storage = JSON.parse(localStorage.getItem(USER_PROFILE_KEY));

  // Copia la información del usuario en el local storage
  const storageCopy = { ...storage };

  // Cambia el valor de la propiedad especificada
  storageCopy[property] = newValue;

  // Guarda la nueva copia de la información del usuario
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(storageCopy));

  return true;
};
