import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";
import { CustomIcon } from "../CustomIcon";
import { Header } from "./Header";

interface HelpProps {
  goBack: () => void;
}

export function Help({ goBack }: HelpProps) {
  return (
    <>
      <Header goBack={goBack}>Ayuda</Header>
    </>
  );
}
