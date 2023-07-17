import { MessageType } from "@/lib/types";

export function MessageText({ content }: { content: string }) {
  return <div className="py-1 px-2 break-words dark:text-white">{content}</div>;
}
