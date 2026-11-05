import {
  LucideIcon,
  User as UserIcon,
  Bell,
  Lock,
  Paintbrush,
  Languages,
} from "lucide-react";

import { Icon } from "@/components/ui/Icon";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { UserImage } from "@/components/UserImage";
import useStore from "@/lib/store";
import { Locale, useTranslation } from "@/lib/i18n";

const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const LanguageSelector = () => {
  const { t, locale, setLocale } = useTranslation();
  const label = t("settings.language");
  return (
    <div className="w-full flex items-center">
      <span className="w-20 flex items-center justify-center">
        <Icon icon={Languages} label={label} className="w-6 h-6 text-background-10" />
      </span>
      <label
        htmlFor="settings-language"
        className="py-4 pr-4 flex-1 flex items-center gap-4 border-b text-left text-lg font-medium text-background-12 border-background-7"
      >
        <span className="flex-1">{label}</span>
        <select
          id="settings-language"
          data-testid="language-selector"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="bg-background-1 text-background-12 text-sm font-normal border border-background-7 rounded px-2 py-1 cursor-pointer"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

const UserProfileSummary = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { name, bio } = useStore((state) => state.user);
  return (
    <button
      {...props}
      className="flex gap-6 items-center cursor-pointer w-full p-4 hover:bg-background-3"
    >
      <UserImage className="w-20 h-20" />
      <span className="inline-block flex-1 text-xl text-left text-background-12">
        {name}
        <span className="text-base leading-tight mt-1 line-clamp-2 text-background-11">
          {bio}
        </span>
      </span>
    </button>
  );
};

type ItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
};

const Item = ({ icon, label, subtitle, ...rest }: ItemProps) => (
  <button {...rest} className="w-full flex items-center hover:bg-background-3">
    <span className="w-20 flex items-center justify-center">
      <Icon icon={icon} label={label} className="w-6 h-6 text-background-10" />
    </span>

    <span className="py-4 pr-4 flex-1 border-b text-left text-lg font-medium text-background-12 border-background-7">
      {label}
      {subtitle && (
        <span className="block text-sm font-normal text-background-11 mt-0.5">
          {subtitle}
        </span>
      )}
    </span>
  </button>
);

export function Options() {
  const { t } = useTranslation();
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  const { bio } = useStore((state) => state.user);
  const notifications = useStore((state) => state.notifications);
  const privacy = useStore((state) => state.privacy);
  const theme = useStore((state) => state.theme);

  const notificationSubtitle = !notifications.all
    ? t("settings.notificationsOff")
    : notifications.sound && notifications.reactions
    ? t("settings.notificationsSoundAndReactions")
    : notifications.sound
    ? t("settings.notificationsSound")
    : notifications.reactions
    ? t("settings.notificationsReactions")
    : t("settings.notificationsOn");

  const privacySubtitle = privacy.readReceipt
    ? t("settings.readReceiptsOn")
    : t("settings.readReceiptsOff");

  const themeSubtitle =
    theme.mode === "dark"
      ? t("settings.themeDark")
      : theme.mode === "light"
      ? t("settings.themeLight")
      : t("settings.themeSystem");

  return (
    <ScrollArea type="auto" className="pr-2.5">
      <UserProfileSummary
        onClick={() => {
          leftDrawerGoTo("PROFILE");
        }}
      />
      <Item
        label={t("settings.profile")}
        subtitle={bio || t("settings.profileSubtitle")}
        icon={UserIcon}
        onClick={() => {
          leftDrawerGoTo("PROFILE");
        }}
      />
      <Item
        label={t("settings.notifications")}
        subtitle={notificationSubtitle}
        icon={Bell}
        onClick={() => {
          leftDrawerGoTo("NOTIFICATIONS");
        }}
      />
      <Item
        label={t("settings.privacy")}
        subtitle={privacySubtitle}
        icon={Lock}
        onClick={() => {
          leftDrawerGoTo("PRIVACY");
        }}
      />
      <Item
        label={t("settings.theme")}
        subtitle={themeSubtitle}
        icon={Paintbrush}
        onClick={() => {
          leftDrawerGoTo("THEME");
        }}
      />
      <LanguageSelector />
      <footer className="flex w-full justify-center p-3 mt-5">
        <p className="text-base text-background-12">
          {t("welcome.madeWith")}{" "}
          <span className="mx-2" aria-label={t("welcome.cupOfCoffee")}>
            ☕
          </span>
          <a
            className="text-primary-9 hover:underline uppercase"
            href="https://github.com/jeantivan"
          >
            Jean Tivan
          </a>
        </p>
      </footer>
    </ScrollArea>
  );
}
