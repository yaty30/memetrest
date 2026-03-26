import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import { normalizeTagList } from "../src/utils/tagNormalization";

const firebaseConfig = {
  apiKey: "AIzaSyDxyxizdaWeAB6JnLl3ANKuBOjULR2X04s",
  authDomain: "memetrest-b57dc.firebaseapp.com",
  projectId: "memetrest-b57dc",
  storageBucket: "memetrest-b57dc.firebasestorage.app",
  messagingSenderId: "728467233563",
  appId: "1:728467233563:web:737aa30f72aeb2551a11be",
  measurementId: "G-BY2WB5CXK1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateSearchKeywords(
  title: string,
  tags: string[],
  category: string,
  description: string,
  overlayName?: string,
): string[] {
  const keywords = new Set<string>();
  const allText = [
    title,
    ...tags,
    category,
    description,
    overlayName ?? "",
  ].join(" ");
  const words = allText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  for (const word of words) {
    keywords.add(word);
    for (let i = 2; i <= word.length; i++) {
      keywords.add(word.substring(0, i));
    }
  }
  return Array.from(keywords);
}

interface GifEntry {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  description: string;
  tags: string[];
  category: string;
  templateName: string;
  overlayName?: string;
  overlayAvatar?: string;
}

const GIF_MEMES: GifEntry[] = [
  {
    id: "gif-1",
    title: "Confused Math Lady",
    imageUrl: "https://media.giphy.com/media/WRQBXSCnEFJIuxktnw/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/WRQBXSCnEFJIuxktnw/200_s.gif",
    height: 340,
    width: 480,
    description: "Woman surrounded by floating math equations",
    tags: ["confused", "math", "thinking", "reaction"],
    category: "reaction",
    templateName: "Confused Math Lady",
    overlayName: "Luna Nakamura",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Luna",
  },
  {
    id: "gif-2",
    title: "This Is Fine",
    imageUrl: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/200_s.gif",
    height: 280,
    width: 480,
    description: "Dog sitting in a room on fire saying this is fine",
    tags: ["fine", "fire", "calm", "reaction"],
    category: "reaction",
    templateName: "This Is Fine",
  },
  {
    id: "gif-3",
    title: "Disappointed Fan",
    imageUrl: "https://media.giphy.com/media/NTur7XlVDUdqM/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/NTur7XlVDUdqM/200_s.gif",
    height: 320,
    width: 480,
    description: "Fan looking extremely disappointed",
    tags: ["disappointed", "sad", "reaction"],
    category: "reaction",
    templateName: "Disappointed Fan",
    overlayName: "Priya Patel",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Priya",
  },
  {
    id: "gif-4",
    title: "Waiting Around",
    imageUrl: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/200_s.gif",
    height: 360,
    width: 480,
    description: "Standing around looking bored waiting for something",
    tags: ["waiting", "bored", "sad", "reaction"],
    category: "reaction",
    templateName: "Waiting Around",
  },
  {
    id: "gif-5",
    title: "Elmo Rise",
    imageUrl: "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/200_s.gif",
    height: 300,
    width: 480,
    description: "Elmo rising with flames in the background",
    tags: ["elmo", "fire", "chaos", "funny"],
    category: "dark",
    templateName: "Elmo Rise",
    overlayName: "Alex Kim",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
  },
  {
    id: "gif-6",
    title: "Change My Mind",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKp7tZp6XvS1YmQ/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/3o7TKp7tZp6XvS1YmQ/200_s.gif",
    height: 360,
    width: 480,
    description: "Man sitting at a desk with a 'Change My Mind' sign",
    tags: ["opinion", "debate", "funny"],
    category: "reaction",
    templateName: "Change My Mind",
    overlayName: "Jordan Smith",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan",
  },
  {
    id: "gif-7",
    title: "Hide in Bushes",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/jUwpNzg9IcyrK/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/jUwpNzg9IcyrK/200_s.gif",
    height: 360,
    width: 480,
    description: "Homer Simpson backing into a hedge",
    tags: ["awkward", "exit", "simpsons"],
    category: "reaction",
    templateName: "Homer Bushes",
  },
  {
    id: "gif-8",
    title: "Success Kid",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/12AyP4ELe47h9S/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/12AyP4ELe47h9S/200_s.gif",
    height: 360,
    width: 480,
    description: "Toddler clenching fist with determined face",
    tags: ["win", "success", "happy"],
    category: "wholesome",
    templateName: "Success Kid",
    overlayName: "Sam Rivera",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sam",
  },
  {
    id: "gif-9",
    title: "Roll Safe",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/d3mlE7uhX8KFgEmY/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/200_s.gif",
    height: 270,
    width: 480,
    description: "Man pointing to his temple smiling",
    tags: ["smart", "logic", "thinking"],
    category: "reaction",
    templateName: "Think About It",
  },
  {
    id: "gif-10",
    title: "Side Eye Chloe",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/AAsj7jdrHjtp6/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/AAsj7jdrHjtp6/200_s.gif",
    height: 360,
    width: 480,
    description: "Little girl giving a skeptical look from a car seat",
    tags: ["judgment", "skeptical", "funny"],
    category: "reaction",
    templateName: "Side Eye Chloe",
    overlayName: "Mila Kun",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mila",
  },
  {
    id: "gif-11",
    title: "Surprised Pikachu",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3kzJvEciJaCWKG4p7v/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/3kzJvEciJaCWKG4p7v/200_s.gif",
    height: 380,
    width: 480,
    description: "Low-res Pikachu with an open mouth in shock",
    tags: ["shock", "pokemon", "sarcasm"],
    category: "reaction",
    templateName: "Surprised Pikachu",
  },
  {
    id: "gif-12",
    title: "Distracted Boyfriend",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7btXv9i4Pnjb1mBa/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/3o7btXv9i4Pnjb1mBa/200_s.gif",
    height: 320,
    width: 480,
    description:
      "Man looking at another woman while his girlfriend looks angry",
    tags: ["cheating", "choice", "temptation"],
    category: "funny",
    templateName: "Distracted Boyfriend",
  },
  {
    id: "gif-13",
    title: "Woman Yelling at Cat",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/c6XmS8aYwS28K2P9uL/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/c6XmS8aYwS28K2P9uL/200_s.gif",
    height: 270,
    width: 480,
    description:
      "Real Housewives star yelling at a white cat at a dinner table",
    tags: ["argument", "cat", "confusion"],
    category: "reaction",
    templateName: "Woman Yelling at Cat",
    overlayName: "Taylor S",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Taylor",
  },
  {
    id: "gif-14",
    title: "Mocking Spongebob",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/QUXYpg6nNF49W/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/QUXYpg6nNF49W/200_s.gif",
    height: 360,
    width: 480,
    description: "Spongebob acting like a chicken",
    tags: ["mocking", "sarcasm", "spongebob"],
    category: "reaction",
    templateName: "Mocking Spongebob",
  },
  {
    id: "gif-15",
    title: "Disaster Girl",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/yr7n0u3qzJC8mLP79z/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/yr7n0u3qzJC8mLP79z/200_s.gif",
    height: 360,
    width: 480,
    description:
      "Young girl smirking at camera while house burns in background",
    tags: ["chaos", "evil", "fire"],
    category: "dark",
    templateName: "Disaster Girl",
  },
  {
    id: "gif-16",
    title: "Drake Hotline Bling",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l41lI4bYvjO5f0fvy/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l41lI4bYvjO5f0fvy/200_s.gif",
    height: 270,
    width: 480,
    description: "Drake dancing and rejecting/approving things",
    tags: ["preference", "drake", "dance"],
    category: "reaction",
    templateName: "Drake Hotline",
    overlayName: "Aubrey G",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Aubrey",
  },
  {
    id: "gif-17",
    title: "Kermit Typing",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/13GIgrGdslD9oQ/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/13GIgrGdslD9oQ/200_s.gif",
    height: 360,
    width: 480,
    description: "Kermit the Frog typing furiously on a keyboard",
    tags: ["work", "typing", "stress"],
    category: "reaction",
    templateName: "Kermit Fast",
  },
  {
    id: "gif-18",
    title: "Spider-Man Pointing",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l36kU8adTrfPXV5PWA/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l36kU8adTrfPXV5PWA/200_s.gif",
    height: 270,
    width: 480,
    description: "Two Spider-Men pointing at each other",
    tags: ["identical", "imposter", "marvel"],
    category: "funny",
    templateName: "Spider-Man Pointing",
  },
  {
    id: "gif-19",
    title: "Is This a Pigeon?",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/XyU72JtLhDSm4/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/XyU72JtLhDSm4/200_s.gif",
    height: 360,
    width: 480,
    description: "Anime man pointing at a butterfly and calling it a pigeon",
    tags: ["confusion", "anime", "misunderstanding"],
    category: "reaction",
    templateName: "Is This a Pigeon",
  },
  {
    id: "gif-20",
    title: "Grumpy Cat",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/v6aOebdXKnK9O/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/v6aOebdXKnK9O/200_s.gif",
    height: 360,
    width: 480,
    description: "Cat with a permanent frown",
    tags: ["no", "grumpy", "cat"],
    category: "reaction",
    templateName: "Grumpy Cat",
    overlayName: "Felix Gray",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  },
  {
    id: "gif-21",
    title: "One Does Not Simply",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/smW5FjnkHNAiY/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/smW5FjnkHNAiY/200_s.gif",
    height: 270,
    width: 480,
    description: "Boromir saying one does not simply walk into Mordor",
    tags: ["difficult", "lotr", "logic"],
    category: "reaction",
    templateName: "Boromir Simply",
  },
  {
    id: "gif-22",
    title: "Evil Kermit",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKVUn7iM8FMEU24/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/200_s.gif",
    height: 270,
    width: 480,
    description: "Kermit talking to his dark self in a hood",
    tags: ["temptation", "inner voice", "funny"],
    category: "dark",
    templateName: "Evil Kermit",
  },
  {
    id: "gif-23",
    title: "Pepe Silvia",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l0IylOPCNkiqOgMyA/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/200_s.gif",
    height: 270,
    width: 480,
    description: "Charlie from Always Sunny explaining a conspiracy",
    tags: ["conspiracy", "crazy", "explaining"],
    category: "reaction",
    templateName: "Charlie Conspiracy",
    overlayName: "Charlie K",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie",
  },
  {
    id: "gif-24",
    title: "Grandpa Simpson Leaving",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/11gC4ODpiRKuha/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/11gC4ODpiRKuha/200_s.gif",
    height: 360,
    width: 480,
    description: "Grandpa Simpson walks in and immediately walks out",
    tags: ["leaving", "nope", "simpsons"],
    category: "reaction",
    templateName: "Grandpa Out",
  },
  {
    id: "gif-25",
    title: "Arthur Fist",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/WoF3yfYupTt8mHc7va/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/WoF3yfYupTt8mHc7va/200_s.gif",
    height: 360,
    width: 480,
    description: "Arthur the Aardvark clenching his fist",
    tags: ["anger", "frustrated", "kids show"],
    category: "reaction",
    templateName: "Arthur Fist",
  },
  {
    id: "gif-26",
    title: "Thinking Shaq",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/UO5elnTqo4vSg/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/UO5elnTqo4vSg/200_s.gif",
    height: 360,
    width: 480,
    description: "Shaquille O'Neal looking confused then nodding",
    tags: ["shaq", "thinking", "agreement"],
    category: "reaction",
    templateName: "Thinking Shaq",
    overlayName: "Big Diesel",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Shaq",
  },
  {
    id: "gif-27",
    title: "Confused Travolta",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/6uGhT1O4sxpi8/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/6uGhT1O4sxpi8/200_s.gif",
    height: 270,
    width: 480,
    description: "Vincent Vega looking around confused in a room",
    tags: ["lost", "where", "confused"],
    category: "reaction",
    templateName: "Lost Travolta",
  },
  {
    id: "gif-28",
    title: "Bernie I Am Asking",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l6jTwS2sCZ1LiHe65V/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l6jTwS2sCZ1LiHe65V/200_s.gif",
    height: 360,
    width: 480,
    description:
      "Bernie Sanders saying I am once again asking for your support",
    tags: ["money", "asking", "help"],
    category: "funny",
    templateName: "Bernie Support",
  },
  {
    id: "gif-29",
    title: "The Office No",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/hyyV7pnbE0FqLNBAzs/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/hyyV7pnbE0FqLNBAzs/200_s.gif",
    height: 270,
    width: 480,
    description: "Michael Scott yelling 'No' repeatedly",
    tags: ["no", "office", "despair"],
    category: "reaction",
    templateName: "Michael No",
    overlayName: "Michael S",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Scott",
  },
  {
    id: "gif-30",
    title: "Rollin' Height",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/VvXg0Vjm4FpEQ/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/VvXg0Vjm4FpEQ/200_s.gif",
    height: 360,
    width: 480,
    description: "Dog wearing sunglasses in a toy car",
    tags: ["cool", "dog", "vibe"],
    category: "wholesome",
    templateName: "Cool Dog",
  },
  {
    id: "gif-31",
    title: "Salt Bae",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l4Jz3a8osLCADuxC8/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l4Jz3a8osLCADuxC8/200_s.gif",
    height: 270,
    width: 480,
    description: "Chef sprinkling salt with flair",
    tags: ["extra", "salt", "cooking"],
    category: "reaction",
    templateName: "Salt Bae",
  },
  {
    id: "gif-32",
    title: "Mind Blown",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/Um3ljJl8jRnHy/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/Um3ljJl8jRnHy/200_s.gif",
    height: 360,
    width: 480,
    description: "Man gesturing mind blowing explosion from head",
    tags: ["wow", "science", "shock"],
    category: "reaction",
    templateName: "Mind Blown",
  },
  {
    id: "gif-33",
    title: "Everything is Awesome",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKVUn7iM8FMEU24/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/200_s.gif",
    height: 270,
    width: 480,
    description: "Lego character smiling brightly",
    tags: ["happy", "lego", "awesome"],
    category: "wholesome",
    templateName: "Lego Happy",
  },
  {
    id: "gif-34",
    title: "Squinting Fry",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/ANbD1CCdA3iI8/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/ANbD1CCdA3iI8/200_s.gif",
    height: 360,
    width: 480,
    description: "Fry from Futurama squinting eyes suspiciously",
    tags: ["suspicious", "skeptical", "futurama"],
    category: "reaction",
    templateName: "Squinting Fry",
    overlayName: "Philip Fry",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Fry",
  },
  {
    id: "gif-35",
    title: "Angry Table Flip",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/uKT0nGaMABjaE/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/uKT0nGaMABjaE/200_s.gif",
    height: 360,
    width: 480,
    description: "Anime character flipping a table in rage",
    tags: ["rage", "done", "tableflip"],
    category: "reaction",
    templateName: "Table Flip",
  },
  {
    id: "gif-36",
    title: "Awkward Puppet",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/H5C8CevNMbpBqUeXHL/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/H5C8CevNMbpBqUeXHL/200_s.gif",
    height: 360,
    width: 480,
    description: "Monkey puppet looking away awkwardly",
    tags: ["awkward", "guilt", "funny"],
    category: "reaction",
    templateName: "Monkey Puppet",
  },
  {
    id: "gif-37",
    title: "Hide Pain Harold",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/7T33BLlB7NQrjozoRB/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/7T33BLlB7NQrjozoRB/200_s.gif",
    height: 360,
    width: 480,
    description: "Old man smiling through the pain",
    tags: ["pain", "smile", "harold"],
    category: "reaction",
    templateName: "Harold Smile",
    overlayName: "Harold A",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Harold",
  },
  {
    id: "gif-38",
    title: "First Time?",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/uUIq6zL9h0F1e/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/uUIq6zL9h0F1e/200_s.gif",
    height: 270,
    width: 480,
    description: "James Franco with a noose around neck asking 'First time?'",
    tags: ["cowboy", "hanging", "experience"],
    category: "dark",
    templateName: "First Time",
  },
  {
    id: "gif-39",
    title: "Modern Problems",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/90F8aUepslB84/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/90F8aUepslB84/200_s.gif",
    height: 360,
    width: 480,
    description:
      "Dave Chappelle saying modern problems require modern solutions",
    tags: ["smart", "solution", "funny"],
    category: "reaction",
    templateName: "Modern Solutions",
  },
  {
    id: "gif-40",
    title: "Katy Perry Eye",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l4FGpPki5v2705coE/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l4FGpPki5v2705coE/200_s.gif",
    height: 360,
    width: 480,
    description: "Katy Perry's eye twitching/glitching",
    tags: ["glitch", "weird", "conspiracy"],
    category: "dark",
    templateName: "Eye Twitch",
    overlayName: "Kat P",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Katy",
  },
  {
    id: "gif-41",
    title: "Facepalm",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/iW8tsoJWcfPc4/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/iW8tsoJWcfPc4/200_s.gif",
    height: 360,
    width: 480,
    description: "Captain Picard facepalming",
    tags: ["fail", "trek", "disbelief"],
    category: "reaction",
    templateName: "Picard Facepalm",
  },
  {
    id: "gif-42",
    title: "Dancing Baby Groot",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/144waw4K_Sdf4k/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/144waw4K_Sdf4k/200_s.gif",
    height: 270,
    width: 480,
    description: "Baby Groot dancing in a pot",
    tags: ["cute", "marvel", "happy"],
    category: "wholesome",
    templateName: "Groot Dance",
  },
  {
    id: "gif-43",
    title: "Screaming Cowboy",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/9p8mHahLDMbTO/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/9p8mHahLDMbTO/200_s.gif",
    height: 360,
    width: 480,
    description: "Cowboy screaming in the clouds",
    tags: ["loud", "scream", "meme"],
    category: "funny",
    templateName: "Big Enough",
  },
  {
    id: "gif-44",
    title: "They Are the Same Picture",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/l36kU8adTrfPXV5PWA/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/l36kU8adTrfPXV5PWA/200_s.gif",
    height: 270,
    width: 480,
    description: "Pam from The Office comparing two identical things",
    tags: ["identical", "office", "funny"],
    category: "reaction",
    templateName: "Same Picture",
    overlayName: "Pam B",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Pam",
  },
  {
    id: "gif-45",
    title: "Batman Slapping Robin",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/ySpxjJmsq9gsw/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/ySpxjJmsq9gsw/200_s.gif",
    height: 360,
    width: 480,
    description: "Batman giving Robin a high-velocity slap",
    tags: ["dc", "slap", "stop"],
    category: "reaction",
    templateName: "Batman Slap",
  },
  {
    id: "gif-46",
    title: "Good Morning Vietnam",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/10p6Y9syY7uM7u/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/10p6Y9syY7uM7u/200_s.gif",
    height: 360,
    width: 480,
    description: "Robin Williams shouting into a microphone",
    tags: ["morning", "loud", "happy"],
    category: "reaction",
    templateName: "Good Morning",
  },
  {
    id: "gif-47",
    title: "Let Me In",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/yx406dQNC4fK0/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/yx406dQNC4fK0/200_s.gif",
    height: 270,
    width: 480,
    description: "Eric Andre shaking a gate screaming 'Let me in!'",
    tags: ["desperate", "funny", "shouting"],
    category: "reaction",
    templateName: "Let Me In",
    overlayName: "Eric A",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Eric",
  },
  {
    id: "gif-48",
    title: "Leo Toast",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/BPGWcahZMPrRXY97Wy/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/BPGWcahZMPrRXY97Wy/200_s.gif",
    height: 270,
    width: 480,
    description: "Gatsby raising a glass for a toast",
    tags: ["cheers", "celebration", "gatsby"],
    category: "reaction",
    templateName: "Leo Toast",
  },
  {
    id: "gif-49",
    title: "Keep Your Secrets",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/S5n7WKHVx5xqs/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/S5n7WKHVx5xqs/200_s.gif",
    height: 360,
    width: 480,
    description: "Frodo saying 'Alright then, keep your secrets'",
    tags: ["secrets", "lotr", "fine"],
    category: "reaction",
    templateName: "Frodo Secrets",
  },
  {
    id: "gif-50",
    title: "Excited Jonah Hill",
    imageUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJpZ3B6amZ6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3R6Z3ImZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/87NSvDMB8pY6p0L12L/giphy.gif",
    thumbnailUrl: "https://media.giphy.com/media/87NSvDMB8pY6p0L12L/200_s.gif",
    height: 360,
    width: 480,
    description: "Jonah Hill screaming with excitement",
    tags: ["yay", "excited", "happy"],
    category: "reaction",
    templateName: "Jonah Excited",
    overlayName: "Jonah H",
    overlayAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Hill",
  },
];

async function seedGifs() {
  console.log(`Seeding ${GIF_MEMES.length} GIF memes to Firestore...\n`);

  for (const gif of GIF_MEMES) {
    const tags = normalizeTagList(gif.tags);
    const searchKeywords = generateSearchKeywords(
      gif.title,
      tags,
      gif.category,
      gif.description,
      gif.overlayName,
    );

    const memeDoc = {
      title: gif.title,
      description: gif.description,
      tags,
      category: gif.category,
      searchKeywords,
      height: gif.height,
      width: gif.width,
      imageUrl: gif.imageUrl,
      storagePath: "",
      mimeType: "image/gif",
      animated: true,
      thumbnailUrl: gif.thumbnailUrl,
      uploadedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      nsfw: false,
      sensitive: false,
      likeCount: 0,
      shareCount: 0,
      downloadCount: 0,
      popularityScore: 0,
      language: "en",
      templateName: gif.templateName,
      overlay: gif.overlayName
        ? { avatar: gif.overlayAvatar ?? "", name: gif.overlayName }
        : null,
    };

    await setDoc(doc(db, "memes", gif.id), memeDoc);
    console.log(`✓ ${gif.title} → memes/${gif.id}`);
  }

  console.log("\nDone! GIF memes seeded successfully.");
}

seedGifs().catch(console.error);
