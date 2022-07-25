import { motion } from "framer-motion";
import { BsArrowLeft } from "react-icons/bs";
import { CustomIcon } from "../CustomIcon";
import { Header } from "./Header";

interface BackgroundProps {
  goBack: () => void;
}

export function Background({ goBack }: BackgroundProps) {
  return (
    <>
      <Header goBack={goBack}>Elegir color de fondo</Header>
    </>
  );
}
