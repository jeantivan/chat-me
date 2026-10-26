import { TMessage } from "@/lib/types";
import { EMOJI_IMAGES_PATH, REACTIONS } from "@/lib/utils/constants";
import mc from "@/lib/utils/mergeClassnames";

type ReactionsProps = {
  className?: string;
  reactions: TMessage["reactions"];
};
export function Reactions({ reactions, className }: ReactionsProps) {
  if (!reactions || reactions.length <= 0) {
    return null;
  }

  return (
    <div className={mc("select-none mr-auto flex gap-0.5", className)}>
      {reactions.map(({ owner, type }) => {
        const reactionInfo = REACTIONS[type as keyof typeof REACTIONS];
        return (
          <div key={owner} className="py-0.5 px-1 rounded-full bg-background-10">
            {reactionInfo ? (
              <img
                className="w-5 h-5"
                src={`${EMOJI_IMAGES_PATH}/32/${reactionInfo.img}`}
                alt={reactionInfo.emoji}
              />
            ) : (
              <span className="text-xs leading-none">{type}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
