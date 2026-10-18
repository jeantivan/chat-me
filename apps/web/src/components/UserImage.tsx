import * as Avatar from "@radix-ui/react-avatar";
import { UserCircle2 } from "lucide-react";

import useStore from "@/lib/store";
import mc from "@/lib/utils/mergeClassnames";

export function UserImage({ className }: { className?: string }) {
  const picture = useStore((state) => state.user.picture);

  return (
    <Avatar.Root
      className={mc("bg-background-6 rounded-full overflow-hidden", className)}
    >
      <Avatar.Image src={picture} alt="Tu foto de perfil"></Avatar.Image>
      <Avatar.Fallback className="w-full h-full">
        <UserCircle2
          className="w-full h-full text-neutral-400"
          strokeWidth={1}
        />
      </Avatar.Fallback>
    </Avatar.Root>
  );
}
