import cx from "classnames";
import { ReactionType } from "../../types";
import { Reaction } from "../Reactions";

interface MessageReactionsProps {
  isOwnMsg: boolean;
  reactions: ReactionType[] | [];
}

export function MessageReactions({
  reactions,
  isOwnMsg,
}: MessageReactionsProps) {
  return (
    <div className="w-full flex items-center min-h-[30px]">
      <div
        className={cx(
          "dark:bg-slate-700 bg-white border border-slate-200 dark:border-slate-800 px-1 py-0.5 rounded-full inline-flex",
          "min-w-[40px] -mt-1 z-10",
          {
            "mr-auto ml-3": !isOwnMsg,
            "ml-auto mr-3": isOwnMsg,
          }
        )}
      >
        {reactions.map(({ reaction }) => (
          <Reaction key={reaction.type} type={reaction.type} />
        ))}
        <span className="w-4 text-base text-gray-500 dark:text-gray-400">
          {reactions.length}
        </span>
      </div>
    </div>
  );
}
