import * as Popover from "@radix-ui/react-popover";
import cx from "classnames";
import {
  BsPaperclip,
  BsPersonFill,
  BsFileEarmarkFill,
  BsCameraFill,
  BsImageFill,
  BsStickyFill,
} from "react-icons/bs";
import { useState } from "react";
import { CustomIcon } from "./CustomIcon";
import { Fab } from "./Fab";
import { motion, AnimatePresence } from "framer-motion";

const attachOptions = [
  {
    label: "Contacto",
    icon: BsPersonFill,
    bgColor: "bg-cyan-500",
    beforeBgColor: "before:bg-cyan-600",
  },
  {
    label: "Archivo",
    icon: BsFileEarmarkFill,
    bgColor: "bg-violet-500",
    beforeBgColor: "before:bg-violet-600",
  },
  {
    label: "Cámara",
    icon: BsCameraFill,
    bgColor: "bg-rose-500",
    beforeBgColor: "before:bg-rose-600",
  },
  {
    label: "Sticker",
    icon: BsStickyFill,
    bgColor: "bg-blue-500",
    beforeBgColor: "before:bg-blue-700",
  },
  {
    label: "Fotos y videos",
    icon: BsImageFill,
    bgColor: "bg-fuchsia-500",
    beforeBgColor: "before:bg-fuchsia-600",
  },
];

const variants = {
  transition: { type: "tween" },
  enter: {
    transition: {
      when: "beforeChildren",
      staggerDirection: -1,
      staggerChildren: 0.03,
    },
  },
  exit: {
    transition: {
      when: "afterChildren",
      staggerDirection: -1,
      staggerChildren: 0.03,
    },
  },
};

const AnimatePopoverContent = motion(Popover.Content);

export function AttachFilesMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cx(
          "w-10 h-10 p-2 rounded-full dark:text-slate-400 text-slate-600",
          { "dark:bg-gray-600 bg-gray-200": open }
        )}
      >
        <CustomIcon
          className="block rotate-45"
          label="Adjuntar archivos"
          Icon={BsPaperclip}
        />
      </Popover.Trigger>
      <AnimatePresence>
        {open && (
          <AnimatePopoverContent
            forceMount
            side="top"
            align="start"
            sideOffset={20}
            avoidCollisions={false}
            className="w-auto"
            variants={variants}
            initial="exit"
            animate="enter"
            exit="exit"
          >
            {attachOptions.map((option, i) => (
              <Fab key={option.label} {...option} />
            ))}
          </AnimatePopoverContent>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
}
