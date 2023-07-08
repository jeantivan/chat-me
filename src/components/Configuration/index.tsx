import cx from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Notifications } from "./Notifications";
import { Profile } from "./Profile";
import { Privacy } from "./Privacy";
import { Security } from "./Security";
import { Theme } from "./Theme";
import { Background } from "./Background";
import { SolInfo } from "./SolInfo";
import { Help } from "./Help";
import { Options } from "./Options";

import { useLeftDrawer } from "@/components/LeftDrawer";
import { ConfigurationOptionsType } from "@/lib/types";

const renderOptions: { [x: string]: (goBack: () => void) => JSX.Element } = {
  NOTIFICATIONS: (goBack) => (
    <Notifications key="NOTIFICATIONS" goBack={goBack} />
  ),
  PROFILE: (goBack) => <Profile key="NOTIFICATION" goBack={goBack} />,
  PRIVACY: (goBack) => <Privacy key="PRIVACY" goBack={goBack} />,
  SECURITY: (goBack) => <Security key="SECURITY" goBack={goBack} />,
  THEME: () => <Theme key="THEME" />,
  BACKGROUND: (goBack) => <Background key="BACKGROUND" goBack={goBack} />,
  SOL_INFO: (goBack) => <SolInfo key="SOL_INFO" goBack={goBack} />,
  HELP: (goBack) => <Help key="HELP" goBack={goBack} />,
};

const getRenderOption = (
  option: ConfigurationOptionsType,
  goBack: () => void
) => {
  return renderOptions[option](goBack);
};

export function Configuration() {
  const { closeLeftDrawer } = useLeftDrawer();
  const [renderOption, setRenderOption] =
    useState<ConfigurationOptionsType>("OPTIONS");

  const goBack = () => {
    setRenderOption("OPTIONS");
  };

  return (
    <div
      className={cx(
        "overflow-hidden relative",
        "before:content[''] before:absolute before:top-0 before:left-0",
        "before:bg-emerald-700 before:dark:bg-slate-700",
        "before:w-full before:h-[112px]"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {renderOption === "OPTIONS" ? (
          <Options
            key="OPTIONS"
            goBack={closeLeftDrawer}
            setRenderOption={setRenderOption}
          />
        ) : (
          getRenderOption(renderOption, goBack)
        )}
      </AnimatePresence>
    </div>
  );
}
