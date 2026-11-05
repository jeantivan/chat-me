import * as Separator from "@radix-ui/react-separator";
import * as Label from "@radix-ui/react-label";
import { ChevronRight } from "lucide-react";
import type { PrivacyAudience } from "@chat-me/shared";

import { Icon } from "@/components/ui/Icon";
import { Checkbox } from "@/components/ui/Checkbox";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";
import { TranslationKey, useTranslation } from "@/lib/i18n";
import { useUserSettings, useUpdateSettings, useBlockedUsers } from "@/lib/api/settingsQueries";

const AUDIENCE_LABEL_KEYS: Record<PrivacyAudience, TranslationKey> = {
  all: "settings.audienceAll",
  contacts: "settings.audienceContacts",
  none: "settings.audienceNone",
};

const AUDIENCE_VALUES: PrivacyAudience[] = ["all", "contacts", "none"];

interface AudienceOptionProps {
  id: string;
  label: string;
  value: PrivacyAudience;
  onChange: (value: PrivacyAudience) => void;
  className?: string;
}

function AudienceOption({
  id,
  label,
  value,
  onChange,
  className = "relative flex py-4 items-center text-sm cursor-pointer group",
}: AudienceOptionProps) {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <div className="flex-1">
        <h3 className="text-background-12">{label}</h3>
        <p className="text-background-11">
          {t(AUDIENCE_LABEL_KEYS[value] ?? AUDIENCE_LABEL_KEYS.all)}
        </p>
      </div>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as PrivacyAudience)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {AUDIENCE_VALUES.map((audience) => (
          <option key={audience} value={audience}>
            {t(AUDIENCE_LABEL_KEYS[audience])}
          </option>
        ))}
      </select>
      <Icon
        icon={ChevronRight}
        label="chevron-right-icon"
        className="w-6 h-6 text-background-9 pointer-events-none"
      />
    </div>
  );
}

export function Privacy() {
  const { t } = useTranslation();
  const { data: userSettings } = useUserSettings();
  const { data: blockedUsers = [] } = useBlockedUsers();
  const zustandPrivacy = useStore((state) => state.privacy);
  const setPrivacy = useStore((state) => state.setPrivacy);
  const leftDrawerGoTo = useStore((state) => state.leftDrawerGoTo);
  const { mutate: updateSettings } = useUpdateSettings();

  const privacy = {
    lastTimeOnline: userSettings?.privacyLastSeen ?? zustandPrivacy.lastTimeOnline,
    picture: userSettings?.privacyPicture ?? zustandPrivacy.picture,
    bio: userSettings?.privacyBio ?? zustandPrivacy.bio,
    groups: userSettings?.privacyGroups ?? zustandPrivacy.groups,
    readReceipt: userSettings?.privacyReadReceipt ?? zustandPrivacy.readReceipt,
  };

  return (
    <ScrollArea type="auto">
      <div className="grid pr-2.5 bg-background-5">
        <div className="py-4 px-6 mb-5 bg-background-2">
          <h2 className="text-primary-9 mb-4">
            {t("settings.privacyHeading")}
          </h2>

          <AudienceOption
            id="privacy-last-seen"
            label={t("settings.lastSeen")}
            value={privacy.lastTimeOnline}
            className="relative flex pb-4 items-center text-sm cursor-pointer group"
            onChange={(val) => {
              setPrivacy("lastTimeOnline", val);
              updateSettings({ privacyLastSeen: val });
            }}
          />

          <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />

          <AudienceOption
            id="privacy-picture"
            label={t("settings.profilePhoto")}
            value={privacy.picture}
            onChange={(val) => {
              setPrivacy("picture", val);
              updateSettings({ privacyPicture: val });
            }}
          />

          <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />

          <AudienceOption
            id="privacy-bio"
            label={t("settings.about")}
            value={privacy.bio}
            onChange={(val) => {
              setPrivacy("bio", val);
              updateSettings({ privacyBio: val });
            }}
          />

          <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />

          <div className="flex pt-4 items-center">
            <Label.Root asChild htmlFor="privacy-read-receipt">
              <div className="select-none mr-2 text-background-12 cursor-pointer">
                {t("settings.readReceipts")}
                <span className="mt-1 select-none text-sm inline-block text-background-11">
                  {t("settings.readReceiptsDesc")}
                </span>
              </div>
            </Label.Root>
            <Checkbox
              id="privacy-read-receipt"
              aria-label={t("settings.readReceipts")}
              checked={privacy.readReceipt}
              onCheckedChange={(checked) => {
                const nextVal = Boolean(checked);
                setPrivacy("readReceipt", nextVal);
                updateSettings({ privacyReadReceipt: nextVal });
              }}
            />
          </div>
        </div>

        <div className="py-4 px-6 bg-background-2">
          <AudienceOption
            id="privacy-groups"
            label={t("settings.groups")}
            value={privacy.groups}
            className="relative flex py-3 items-center text-sm cursor-pointer group"
            onChange={(val) => {
              setPrivacy("groups", val);
              updateSettings({ privacyGroups: val });
            }}
          />

          <div
            role="button"
            tabIndex={0}
            data-testid="blocked-contacts-entry"
            onClick={() => leftDrawerGoTo("BLOCKED_USERS")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                leftDrawerGoTo("BLOCKED_USERS");
              }
            }}
            className="flex py-3 items-center text-sm cursor-pointer group"
          >
            <div className="flex-1">
              <h3 className="text-background-12">{t("settings.blockedContacts")}</h3>
              <p data-testid="blocked-contacts-count" className="text-background-11">
                {blockedUsers.length}
              </p>
            </div>
            <Icon
              icon={ChevronRight}
              label="chevron-right-icon"
              className="w-6 h-6 text-background-9 group-hover:text-background-12 transition-colors"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
