import { LinkNode, AutoLinkNode } from "@lexical/link";
import { EmojiNode } from "./nodes/EmojiNode";
import { theme } from "./theme";

export const baseConfig = {
  theme: theme,
  nodes: [AutoLinkNode, LinkNode, EmojiNode],
  onError(error: Error) {
    console.error(error);
  }
};
