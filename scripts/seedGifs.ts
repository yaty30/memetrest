import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

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
];

async function seedGifs() {
  console.log(`Seeding ${GIF_MEMES.length} GIF memes to Firestore...\n`);

  for (const gif of GIF_MEMES) {
    const searchKeywords = generateSearchKeywords(
      gif.title,
      gif.tags,
      gif.category,
      gif.description,
      gif.overlayName,
    );

    const memeDoc = {
      title: gif.title,
      description: gif.description,
      tags: gif.tags,
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
