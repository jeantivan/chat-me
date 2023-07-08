import { IconType } from "react-icons";
import {
  BsQuestionCircleFill,
  BsFileEarmarkTextFill,
  BsPeopleFill,
} from "react-icons/bs";
import { CustomIcon } from "@/components/CustomIcon";
import { AnimateOptionChange } from "./AnimateOptionChange";
import { Header } from "./Header";

const Item = ({ icon, label, ...rest }: { icon: IconType; label: string }) => (
  <div
    {...rest}
    className="w-full flex items-center hover:bg-neutral-100 dark:hover:bg-slate-700 select-none"
  >
    <span className="w-14 flex items-center justify-center">
      <span className="w-5 h-5 text-slate-400">
        <CustomIcon icon={icon} label={label} />
      </span>
    </span>

    <span className="py-5 pl-4 flex-1 border-b text-left text-lg text-neutral-900 dark:text-neutral-50 border-slate-200 dark:border-slate-700">
      {label}
    </span>
  </div>
);
interface HelpProps {
  goBack: () => void;
}

export function Help({ goBack }: HelpProps) {
  return (
    <AnimateOptionChange>
      <Header goBack={goBack}>Ayuda</Header>
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
    </AnimateOptionChange>
  );
}
