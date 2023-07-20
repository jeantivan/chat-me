// import { USER_PROFILE_KEY, INITIAL_USER } from "./constants";

// enum PropertyEnum {}

// export const changeLocalStorageUserInfo = (
//   property: "name" | "status" | "picture",
//   newValue: string
// ) => {
//   // Si la propiedad no existe en el objecto del localStorage
//   if (!Object.keys(INITIAL_USER).includes(property)) {
//     console.error(
//       `The property ${property} does not exist in localStorage ${USER_PROFILE_KEY}`
//     );
//     return false;
//   }

//   // Obtiene el valor actual de la información del usuario en el localStorage
//   const storage = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || "");

//   // Copia la información del usuario en el local storage
//   const storageCopy = { ...storage };

//   // Cambia el valor de la propiedad especificada
//   storageCopy[property] = newValue;

//   // Guarda la nueva copia de la información del usuario
//   localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(storageCopy));

//   return true;
// };
