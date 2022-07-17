export type User = {
  name: string;
  status: string;
  picture: string;
};

export type Contact = {
  name: { title: string; first: string; last: string; fullName: string };
  phone: string;
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
  lastMessage?: Message;
};

export type Message = {
  id: string;
  type: "send" | "received";
  status: "sended" | "received" | "read";
  message: {
    type: "audio" | "video" | "image" | "text" | "sticker";
    content: string;
  };
  time: Date | string;
  reactions?: Array<Reaction>;
};

export type Reaction = {
  emoji: string;
  title: string;
};
