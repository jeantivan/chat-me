import * as Separator from "@radix-ui/react-separator";
import * as Label from "@radix-ui/react-label";
import { ChevronRight } from "lucide-react";
import type { PrivacyAudience } from "@chat-me/shared";

import { Icon } from "@/components/ui/Icon";
import { Checkbox } from "@/components/ui/Checkbox";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";
import { useUserSettings, useUpdateSettings } from "@/lib/api/settingsQueries";

const AUDIENCE_LABELS: Record<PrivacyAudience, string> = {
  all: "Todos",
  contacts: "Mis contactos",
  none: "Nadie",
};

interface AudienceOptionProps {
  id: string;
  label: string;
  ariaLabel?: string;
  value: PrivacyAudience;
  onChange: (value: PrivacyAudience) => void;
  className?: string;
}

function AudienceOption({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  className = "relative flex py-4 items-center text-sm cursor-pointer group",
}: AudienceOptionProps) {
  return (
    <div className={className}>
      <div className="flex-1">
        <h3 className="text-background-12">{label}</h3>
        <p className="text-background-11">
          {AUDIENCE_LABELS[value] || "Todos"}
        </p>
      </div>
      <select
        id={id}
        aria-label={ariaLabel || label}
        value={value}
        onChange={(e) => onChange(e.target.value as PrivacyAudience)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        <option value="all">Todos</option>
        <option value="contacts">Mis contactos</option>
        <option value="none">Nadie</option>
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
  const { data: userSettings } = useUserSettings();
  const zustandPrivacy = useStore((state) => state.privacy);
  const setPrivacy = useStore((state) => state.setPrivacy);
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
            Quién puede ver mi información personal
          </h2>

          <AudienceOption
            id="privacy-last-seen"
            label="Última vez en linea."
            ariaLabel="Última vez en linea"
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
            label="Foto de perfil."
            ariaLabel="Foto de perfil"
            value={privacy.picture}
            onChange={(val) => {
              setPrivacy("picture", val);
              updateSettings({ privacyPicture: val });
            }}
          />

          <Separator.Root className="bg-gray-200 dark:bg-gray-600 w-full h-px" />

          <AudienceOption
            id="privacy-bio"
            label="Info."
            ariaLabel="Info."
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
                Confirmaciones de lectura.
                <span className="mt-1 select-none text-sm inline-block text-background-11">
                  Si desactivas las confirmaciones de lectura, no podrás
                  enviarlas ni recibirlas. Las confirmaciones de lectura se
                  enviarán siempre en los chats grupales.
                </span>
              </div>
            </Label.Root>
            <Checkbox
              id="privacy-read-receipt"
              aria-label="Confirmaciones de lectura."
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
            label="Grupos"
            ariaLabel="Grupos"
            value={privacy.groups}
            className="relative flex py-3 items-center text-sm cursor-pointer group"
            onChange={(val) => {
              setPrivacy("groups", val);
              updateSettings({ privacyGroups: val });
            }}
          />

          <div className="flex py-3 items-center text-sm">
            <div className="flex-1">
              <h3 className="text-background-12">Contactos bloqueados</h3>
              <p className="text-background-11">15</p>
            </div>
            <Icon
              icon={ChevronRight}
              label="chevron-right-icon"
              className="w-6 h-6 text-background-9"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
