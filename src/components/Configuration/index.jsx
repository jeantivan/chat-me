import { useState } from "react";
import { BsGearFill } from "react-icons/bs";
import * as Dialog from "@radix-ui/react-dialog";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { useDarkMode } from "../DarkMode";
import { Drawer } from "../Drawer";
import { Options } from "./Options";
import { Notifications } from "./Notifications";
import { Privacy } from "./Privacy";
import { Help } from "./Help";
import { Background } from "./Background";
import { Profile } from "./Profile";
import { Security } from "./Security";
import { SolInfo } from "./SolInfo";
import { Theme } from "./Theme";
import { MenuIcon, MenuItem } from "../Menu";

const OPTIONS = "OPTIONS";
const renderOptions = {
  OPTIONS: (props) => <Options {...props} />,
  NOTIFICATIONS: (props) => <Notifications {...props} />,
  PROFILE: (props) => <Profile {...props} />,
  PRIVACY: (props) => <Privacy {...props} />,
  SECURITY: (props) => <Security {...props} />,
  THEME: (props) => <Theme {...props} />,
  BACKGROUND: (props) => <Background {...props} />,
  SOL_INFO: (props) => <SolInfo {...props} />,
  HELP: (props) => <Help {...props} />,
};

export function Configuration() {
  const { mode } = useDarkMode();

  const [openModal, setOpenModal] = useState(false);
  const [renderComponent, setRender] = useState(OPTIONS);

  const goBack = () => {
    setRender(OPTIONS);
  };

  return (
    <Dialog.Root open={openModal} onOpenChange={setOpenModal}>
      <MenuItem>
        <Dialog.Trigger className="w-full py-2 px-4 flex items-center">
          <span>Configuración</span>
          <MenuIcon
            label="Abrir configuración"
            Icon={BsGearFill}
            className="ml-auto"
          />
        </Dialog.Trigger>
      </MenuItem>
      <Drawer from="left" open={openModal}>
        <div
          className={`${
            mode === "light" ? "bg-white" : "bg-slate-800"
          } w-full h-full flex flex-col`}
        >
          {renderOptions[renderComponent]({ setRender, goBack })}
        </div>
      </Drawer>
    </Dialog.Root>
  );
}
