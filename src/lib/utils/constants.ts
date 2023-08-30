import { ReactionKeys } from "@/lib/types";

export const COLOR_MODE_KEY = "chatme-dark-mode";
export const USER_PROFILE_KEY = "chatme-user";

export const EMOJI_IMAGES_PATH = "/images/emojis/apple";

export const REACTIONS: Record<
  ReactionKeys,
  {
    shortcode: string;
    emoji: string;
    img: string;
  }
> = {
  ":clapping_hands:": {
    shortcode: ":clapping_hands:",
    emoji: "👏",
    img: "1f44f.png"
  },
  ":sparkling_heart:": {
    shortcode: ":sparkling_heart:",
    emoji: "💖",
    img: "1f496.png"
  },
  ":rolling_on_the_floor_laughing:": {
    shortcode: ":rolling_on_the_floor_laughing:",
    emoji: "😂",
    img: "1f602.png"
  },
  ":hushed_face:": {
    shortcode: ":hushed_face:",
    emoji: "😯",
    img: "1f62f.png"
  },
  ":loudly_crying_face:": {
    shortcode: ":loudly_crying_face:",
    emoji: "😭",
    img: "1f62d.png"
  },
  ":thinking_face:": {
    shortcode: ":thinking_face:",
    emoji: "🤔",
    img: "1f914.png"
  }
};
