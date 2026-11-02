export interface SeedUser {
  email: string;
  name: string;
  bio: string;
  phone: string;
  pictureUrl: string;
}

export interface SampleImage {
  url: string;
  orientation: "square" | "landscape" | "portrait";
  width: number;
  height: number;
  blurhash: string;
  sizeBytes: number;
  caption: string;
}

export const SEED_USERS: SeedUser[] = [
  {
    email: "alice@example.com",
    name: "Alice Smith",
    bio: "Software engineer & open-source enthusiast",
    phone: "+1 555-0101",
    pictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    email: "bob@example.com",
    name: "Bob Builder",
    bio: "Can we build it? Yes we can!",
    phone: "+1 555-0102",
    pictureUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  },
  {
    email: "charlie@example.com",
    name: "Charlie Brown",
    bio: "A day without laughter is a day wasted",
    phone: "+1 555-0103",
    pictureUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
  },
  {
    email: "diana@example.com",
    name: "Diana Prince",
    bio: "Always striving for justice and connection",
    phone: "+1 555-0104",
    pictureUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
  },
  {
    email: "edward@example.com",
    name: "Edward Norton",
    bio: "Distributed systems and high concurrency lover",
    phone: "+1 555-0105",
    pictureUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  {
    email: "fiona@example.com",
    name: "Fiona Gallagher",
    bio: "Frontend architect & design systems specialist",
    phone: "+1 555-0106",
    pictureUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
  },
  {
    email: "george@example.com",
    name: "George Clark",
    bio: "Product strategist and user research fan",
    phone: "+1 555-0107",
    pictureUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  },
  {
    email: "hannah@example.com",
    name: "Hannah Abbott",
    bio: "Passionate about UX accessibility and micro-interactions",
    phone: "+1 555-0108",
    pictureUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
  },
  {
    email: "ian@example.com",
    name: "Ian Malcolm",
    bio: "Chaos theory and real-time network dynamics",
    phone: "+1 555-0109",
    pictureUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  },
  {
    email: "julia@example.com",
    name: "Julia Roberts",
    bio: "Fullstack tinkerer and open-source contributor",
    phone: "+1 555-0110",
    pictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    email: "kevin@example.com",
    name: "Kevin Bacon",
    bio: "Connecting everyone within six degrees",
    phone: "+1 555-0111",
    pictureUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
  },
  {
    email: "laura@example.com",
    name: "Laura Croft",
    bio: "Explorer of obscure database edge cases",
    phone: "+1 555-0112",
    pictureUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
  },
  {
    email: "michael@example.com",
    name: "Michael Scott",
    bio: "World's Best Boss | Regional Paper & Chat Specialist",
    phone: "+1 555-0113",
    pictureUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
  },
  {
    email: "nina@example.com",
    name: "Nina Simone",
    bio: "Jazz music and clean modular codebases",
    phone: "+1 555-0114",
    pictureUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
  },
  {
    email: "oliver@example.com",
    name: "Oliver Queen",
    bio: "Staying focused on targets and clean APIs",
    phone: "+1 555-0115",
    pictureUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
  },
  {
    email: "paula@example.com",
    name: "Paula Abdul",
    bio: "Two steps forward, zero steps back",
    phone: "+1 555-0116",
    pictureUrl: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150",
  },
  {
    email: "quinn@example.com",
    name: "Quinn Fabray",
    bio: "Building fast interfaces with delight",
    phone: "+1 555-0117",
    pictureUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=150",
  },
  {
    email: "rachel@example.com",
    name: "Rachel Green",
    bio: "Fashion tech, coffee lover, and team player",
    phone: "+1 555-0118",
    pictureUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150",
  },
  {
    email: "sam@example.com",
    name: "Sam Winchester",
    bio: "Investigating performance regressions and anomalies",
    phone: "+1 555-0119",
    pictureUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
  },
  {
    email: "tina@example.com",
    name: "Tina Turner",
    bio: "Simply the best real-time experience",
    phone: "+1 555-0120",
    pictureUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
  },
  {
    email: "uma@example.com",
    name: "Uma Thurman",
    bio: "Precision craftsmanship and sharp UI",
    phone: "+1 555-0121",
    pictureUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150",
  },
];

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    orientation: "landscape",
    width: 1200,
    height: 675,
    blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    sizeBytes: 198420,
    caption: "Landscape view from our mountain offsite",
  },
  {
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    orientation: "landscape",
    width: 1280,
    height: 720,
    blurhash: "U%L#Y9xuRjt7_4t7WBofofofWBof",
    sizeBytes: 245100,
    caption: "Working on the new workstation setup today",
  },
  {
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    orientation: "portrait",
    width: 675,
    height: 900,
    blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    sizeBytes: 182300,
    caption: "Modern architecture downtown during the commute",
  },
  {
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
    orientation: "square",
    width: 800,
    height: 800,
    blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    sizeBytes: 154780,
    caption: "Morning coffee break before the sprint demo",
  },
  {
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
    orientation: "landscape",
    width: 1200,
    height: 675,
    blurhash: "U%L#Y9xuRjt7_4t7WBofofofWBof",
    sizeBytes: 312500,
    caption: "Team collaboration session at the design studio",
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    orientation: "landscape",
    width: 1200,
    height: 675,
    blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    sizeBytes: 210400,
    caption: "Incredible mountain sunrise over the valley",
  },
  {
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800",
    orientation: "square",
    width: 800,
    height: 800,
    blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    sizeBytes: 167800,
    caption: "Abstract textures exploring the new color palette",
  },
  {
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    orientation: "landscape",
    width: 1280,
    height: 720,
    blurhash: "U%L#Y9xuRjt7_4t7WBofofofWBof",
    sizeBytes: 220900,
    caption: "Pair programming session on the Socket.IO event handler",
  },
  {
    url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
    orientation: "portrait",
    width: 675,
    height: 900,
    blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    sizeBytes: 195400,
    caption: "Exploring new travel ideas for the summer",
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    orientation: "landscape",
    width: 1200,
    height: 675,
    blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    sizeBytes: 231100,
    caption: "Sunset along the coast after work",
  },
];

const INTROS = [
  "Hey, did you get a chance to see",
  "Just pushed a new commit for",
  "We need to discuss",
  "Everything is running smoothly with",
  "Can you review the changes on",
  "I am currently working on",
  "Take a look at the latest metrics for",
  "The QA team reported good results on",
  "Let me know what you think about",
  "We just deployed",
  "Don't forget the demo for",
  "Working on optimizing",
  "We should coordinate on",
  "Here is a quick update regarding",
  "I was thinking about improving",
  "Sounds like a plan for",
  "Quick reminder about",
  "All integration tests passed for",
  "We are finalizing",
  "Any blockers with",
];

const TOPICS = [
  "the real-time WebSocket connection",
  "the TanStack Query optimistic updates",
  "the Lexical rich text editor plugin",
  "the S3 presigned URL upload flow",
  "the user profile and settings modal",
  "the new group chat participant list",
  "the read watermark synchronization",
  "the delivery receipts and double blue ticks",
  "the unread badge counter logic",
  "the dark mode UI components",
  "the responsive drawer layouts",
  "the MinIO object storage setup",
  "the automated Playwright test suite",
  "the Argon2id password hashing flow",
  "the Redis adapter pub/sub channel",
  "the message reaction popover",
  "the full-text search indexing",
  "the offline message queue handling",
  "the media preview lightbox dialog",
  "the database schema migration pipeline",
];

const OUTROS = [
  "— let's catch up in a bit!",
  "— it looks really solid.",
  "— feel free to leave comments.",
  "— should be ready for production soon.",
  "— let me know if you hit any issues.",
  "— performance looks great so far.",
  "— will update you once it's done.",
  "— tests are green across all browsers.",
  "— check it out when you have a moment.",
  "— ready for the next release.",
];

const STANDALONE_REPLIES = [
  "Sounds great! Thanks for the update.",
  "Awesome work on this!",
  "I'll take a look right away.",
  "On it! Will get back to you shortly.",
  "Looks good to me 👍",
  "Agreed, let's proceed with that approach.",
  "Perfect, thanks for flagging this.",
  "Got it, will test it out now.",
  "Nice catch! Fixed it in the latest branch.",
  "Heading into a meeting now, will reply afterwards.",
  "Could you share the link?",
  "That works for me. See you soon!",
];

export function getRandomPhrase(index: number): string {
  if (index % 4 === 1) {
    return STANDALONE_REPLIES[index % STANDALONE_REPLIES.length];
  }
  const intro = INTROS[index % INTROS.length];
  const topic = TOPICS[(index * 3) % TOPICS.length];
  const outro = OUTROS[(index * 7) % OUTROS.length];
  return `${intro} ${topic} ${outro}`;
}
