import { IconType } from "react-icons";
import {
  BsQuestionCircleFill,
  BsFileEarmarkTextFill,
  BsPeopleFill,
} from "react-icons/bs";
import { CustomIcon } from "@/components/CustomIcon";
import { Header } from "./Header";
import useStore from "@/lib/store";

const Item = ({ icon, label, ...rest }: { icon: IconType; label: string }) => (
  <div {...rest} className="w-full flex items-center hover:bg-background-3">
    <span className="w-20 flex items-center justify-center">
      <span className="w-6 h-6 text-background-10">
        <CustomIcon icon={icon} label={label} />
      </span>
    </span>

    <span className="py-5 pr-4 flex-1 border-b text-left text-lg font-medium text-background-12 border-background-7">
      {label}
    </span>
  </div>
);

export function Help() {
  const closeLeftDrawer = useStore((state) => state.closeLeftDrawer);
  return (
    <>
      <Header goBack={closeLeftDrawer}>Ayuda</Header>
      <div className="h-full flex">
        <div className="w-full mt-auto">
          <Item icon={BsQuestionCircleFill} label="Centro de ayuda" />
          <Item icon={BsPeopleFill} label="Contáctanos" />
          <Item
            icon={BsFileEarmarkTextFill}
            label="Condiciones y Políticas de privacidad"
          />
        </div>
      </div>
    </>
  );
}
