import cx from "classnames";
import { FaBan } from "react-icons/fa";
import {
  BsX,
  BsChevronRight,
  BsStarFill,
  BsBellFill,
  BsLockFill,
  BsClockHistory,
  BsHandThumbsDownFill,
  BsTrashFill,
} from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery, useEventListener } from "usehooks-ts";
import { useDarkMode } from "../DarkMode";
import { useContactInfo } from "./Context";
import { Switch } from "../Switch";
import { CustomIcon } from "../CustomIcon";
import { useRef } from "react";

const Item = ({ children, isDanger }) => {
  const { mode } = useDarkMode();
  const isLight = mode === "light";

  return (
    <div
      className={cx(
        "flex p-4 cursor-pointer",
        { "text-gray-400": !isDanger, "text-red-500": isDanger },
        {
          "hover:bg-slate-50": isLight && isDanger,
          "hover:bg-slate-700": !isLight && isDanger,
        }
      )}
    >
      <div className="flex text-lg w-full">{children}</div>
    </div>
  );
};

const ItemText = ({ children, isDanger, textHelper = "" }) => {
  const { mode } = useDarkMode();
  const isLight = mode === "light";
  const textColor = isDanger
    ? "text-red-500"
    : isLight
    ? "text-neutral-900"
    : "text-gray-100";

  return (
    <div className={`flex-1 flex flex-col leading-none ${textColor}`}>
      {children}

      {textHelper && (
        <span className="mt-1 text-sm text-gray-400">{textHelper}</span>
      )}
    </div>
  );
};

const ItemIcon = ({ label, icon }) => (
  <div className="w-1/6 flex justify-center text-inherit">
    <CustomIcon Icon={icon} label={label} className="w-5 h-5 text-inherit" />
  </div>
);

const ItemAction = ({ children }) => (
  <div className="w-1/6 flex justify-center">{children}</div>
);

const variants = {
  show: (isLg) => ({
    width: isLg ? "40%" : "100%",
    transition: { ease: "easeIn" },
  }),
  exit: { width: "0%", transition: { ease: "easeOut" } },
  transition: { type: "tween", duration: 0.15 },
};

export function ContactInfoContent({ selectedChat }) {
  const { mode } = useDarkMode();
  const isLg = useMediaQuery("(min-width: 1024px");
  const { openContactInfo, setOpenContactInfo } = useContactInfo();
  const documentRef = useRef(document);
  const { name, phone, picture } = selectedChat;
  const isLight = mode === "light";
  const bgColor = isLight ? "bg-white" : "bg-slate-800";
  const textColor = isLight ? "text-neutral-900" : "text-white";

  const onKeyUp = (e) => {
    if (e.key === "Escape") setOpenContactInfo(false);
  };

  useEventListener("keyup", onKeyUp, documentRef);

  return (
    <AnimatePresence>
      {openContactInfo && (
        <motion.div
          variants={variants}
          custom={isLg}
          initial="exit"
          animate="show"
          exit="exit"
          className="relative lg:static h-screen top-0 right-0 border-l border-slate-200 dark:border-slate-600"
        >
          <div
            role="dialog"
            id="contact-info"
            aria-labelledby="contact-info-title"
            tabIndex="-1"
            className="pointer-events-auto h-full"
          >
            <div
              className={`${
                isLight ? "bg-slate-50" : "bg-slate-900"
              } w-full h-full flex flex-col`}
            >
              <header
                className={`p-4 flex items-center h-14 ${
                  isLight ? "bg-slate-100" : "bg-slate-700"
                }`}
              >
                <button
                  className="w-7 h-7 text-slate-500 mr-4"
                  onClick={() => {
                    setOpenContactInfo(false);
                  }}
                >
                  <CustomIcon label="Cerrar info. del contacto" Icon={BsX} />
                </button>
                <h2 id="contact-info-title" className={`text-lg ${textColor}`}>
                  Info. del Contacto
                </h2>
              </header>
              <div className="flex flex-col overflow-y-auto">
                <div
                  className={`py-4 px-5 flex flex-col mb-4 shadow ${bgColor}`}
                >
                  <div className="mx-auto mt-16 mb-4">
                    <div className="w-40 h-40 rounded-full text-gray-500">
                      <img
                        className="bg-gray-400 w-full h-full rounded-full"
                        src={picture.large}
                        alt={`Foto de perfil de ${name.fullName}`}
                      />
                    </div>
                  </div>
                  <div className="mx-auto text-center">
                    <h2 className={`text-2xl mb-2 ${textColor}`}>
                      {name.fullName}
                    </h2>
                    <div className={`text-gray-500`}>{phone}</div>
                  </div>
                </div>
                <div className={`py-4 px-5 mb-4 shadow ${bgColor}`}>
                  <div className="text-sm text-emerald-600">Info.</div>
                  <div className={`text-lg ${textColor}`}>
                    Hola estoy usando ChatMe!
                  </div>
                </div>
                <div className={`py-4 px-5 mb-4 shadow ${bgColor}`}>
                  <div className="flex mb-4">
                    <div className="flex-1 text-sm text-emerald-600">
                      Archivos, enlaces y documentos.
                    </div>
                    <div className="inline-flex items-center text-gray-500 text-sm">
                      20
                      <CustomIcon Icon={BsChevronRight} label="Ver más" />
                    </div>
                  </div>
                  <div className="px-2 flex flex-row w-full mb-4">
                    <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
                    <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
                    <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
                  </div>
                  <div className={`text-sm ${textColor}`}>
                    Usa WhatsApp en tu teléfono para ver el historial de
                    mensajes completo.
                  </div>
                </div>
                <div className={`pt-3 ${bgColor}`}>
                  <div className="w-full mb-5">
                    <Item>
                      <ItemIcon icon={BsStarFill} label="Icono de campana" />
                      <ItemText>Mensajes destacados</ItemText>

                      <ItemAction>
                        <CustomIcon
                          Icon={BsChevronRight}
                          label="Icono flecha derecha"
                          className="w-5 h-5 text-inherit"
                        />
                      </ItemAction>
                    </Item>
                    <Item>
                      <ItemIcon icon={BsBellFill} label="Icono de campana" />
                      <ItemText>Silenciar notificaciones</ItemText>
                      <ItemAction>
                        <Switch />
                      </ItemAction>
                    </Item>
                    <Item>
                      <ItemIcon
                        icon={BsClockHistory}
                        label="Icono de temporizador"
                      />
                      <ItemText textHelper="Desactivados">
                        Mensajes temporales
                      </ItemText>
                      <ItemAction>
                        <CustomIcon
                          Icon={BsChevronRight}
                          label="Icono flecha derecha"
                          className="w-5 h-5 text-inherit"
                        />
                      </ItemAction>
                    </Item>
                    <Item>
                      <ItemIcon icon={BsLockFill} label="Icono de candado" />
                      <ItemText
                        textHelper="Los mensajes están cifrados de extremo a extremo. Haz clic
                      para verificarlo."
                      >
                        Cifrado
                      </ItemText>

                      {/* Solo para ocupar el espacio */}
                      <ItemAction />
                    </Item>
                  </div>
                  <div className="w-full">
                    <Item
                      className={
                        isLight ? "hover:bg-slate-50" : "hover:bg-slate-700"
                      }
                      isDanger
                    >
                      <ItemIcon icon={FaBan} label="Icono de bloquear" />
                      <ItemText isDanger>Bloquear a {name.fullName}</ItemText>
                    </Item>
                    <Item isDanger>
                      <ItemIcon
                        icon={BsHandThumbsDownFill}
                        label="Icono de no me gusta"
                      />
                      <ItemText isDanger>Reportar a {name.fullName}</ItemText>
                    </Item>
                    <Item isDanger>
                      <ItemIcon icon={BsTrashFill} label="Icono de basura" />
                      <ItemText isDanger>Eliminar chat</ItemText>
                    </Item>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
