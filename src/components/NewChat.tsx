import map from "lodash/map";
import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";

import { ScrollArea } from "./ui/ScrollArea";

import mc from "@/lib/utils/mergeClassnames";
import { TUser } from "@/lib/types";
import useStore from "@/lib/store";

type ContactItemProps = React.HTMLAttributes<HTMLDivElement> & {
  contact: TUser;
};
const ContactItem = ({ contact, ...rest }: ContactItemProps) => {
  return (
    <div
      className={mc(
        "flex select-none cursor-pointer p-2 gap-4 rounded-xl",
        "hover:bg-background-4"
      )}
      {...rest}
    >
      <div className="flex items-center">
        <div className="w-14 h-14">
          <img
            className="bg-background-3 w-full h-full overflow-hidden rounded-full"
            src={contact.picture}
            alt={`Foto de perfil de ${contact.name}`}
            loading="lazy"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="flex-1 text-lg truncate dark:text-background-12">
          {contact.name}
        </p>
        <p className="text-background-11 line-clamp-2 text-sm leading-tight">
          {contact.bio}
        </p>
      </div>
    </div>
  );
};

export function NewChat() {
  const allContacts = useStore((state) => state.contacts);

  const groupByFirstLetter = map(
    groupBy(allContacts, "name[0]"),
    (contacts, letter) => ({ letter, contacts })
  );

  const contactOrderedByFirstLetter = orderBy(groupByFirstLetter, "letter");

  return (
    <ScrollArea type="auto">
      <div className="py-4 px-2 text-background-12 grid gap-4">
        {contactOrderedByFirstLetter.map(({ letter, contacts }) => {
          return (
            <div key={letter} className="grid gap-2">
              <div className="text-primary-9 border-b border-primary-3 pb-2 pl-3">
                {letter}
              </div>
              {contacts.map((contact) => (
                <ContactItem key={contact.phone} contact={contact} />
              ))}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
