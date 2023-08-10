import { TMessage } from "@/lib/types";
import { REACTIONS } from "@/lib/utils/constants";
import mc from "@/lib/utils/mergeClassnames";

type ReactionsProps = {
  className?: string;
  reactions: TMessage["reactions"];
};
export function Reactions({ reactions, className }: ReactionsProps) {
  if (reactions.length <= 0) {
    return null;
  }

  return (
    <div className={mc("select-none mr-auto flex gap-0.5", className)}>
      {reactions.map(({ owner, type }) => (
        <div
          key={owner}
          className="p-1 rounded-full bg-background-10 text-[18px] leading-none text-center"
        >
          {REACTIONS[type].emoji}
        </div>
      ))}
    </div>
  );
}
