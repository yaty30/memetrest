import { initializeApp } from "firebase/app";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
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
const storage = getStorage(app);
const db = getFirestore(app);

const TITLES = [
  "Matcha Delight",
  "Desert Cactus",
  "Wild Flowers",
  "Ocean Horizon",
  "Silver Patterns",
  "Lunar Surface",
  "Cozy Fireplace",
  "Red Bloom",
  "Abstract Colors",
  "Golden Architecture",
  "Motion Blur",
  "Mountain Vista",
  "Desert Arch",
  "Misty Mountains",
  "Tropical Pool",
  "Pink Waves",
  "Urban Sunset",
  "Neon Lights",
  "Forest Trail",
  "Calm Waters",
];

const HEIGHTS = [
  220, 300, 260, 420, 400, 240, 380, 300, 360, 300, 380, 280, 340, 260, 300,
  340, 280, 320, 360, 300,
];

function generateTags(title: string): string[] {
  return title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

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

async function seedFirestore() {
  console.log("Listing images in Firebase Storage...\n");

  const memesRef = ref(storage, "memes");
  const result = await listAll(memesRef);

  const sorted = result.items.sort((a, b) => {
    const numA = parseInt(a.name);
    const numB = parseInt(b.name);
    return numA - numB;
  });

  console.log(`Found ${sorted.length} images. Seeding Firestore...\n`);

  for (let i = 0; i < sorted.length; i++) {
    const itemRef = sorted[i];
    const imageUrl = await getDownloadURL(itemRef);
    const fileNameWithoutExt = itemRef.name.replace(/\.[^.]+$/, "");
    const title = TITLES[i] ?? `Image ${i + 1}`;

    const tags = generateTags(title);
    const description = "";
    const category = "uncategorized";
    const overlayName = i === 0 ? "Tiffany Gleason" : undefined;
    const searchKeywords = generateSearchKeywords(
      title,
      tags,
      category,
      description,
      overlayName,
    );

    const memeDoc = {
      title,
      description,
      tags,
      category,
      searchKeywords,
      height: HEIGHTS[i] ?? 300,
      width: 0,
      imageUrl,
      storagePath: `memes/${itemRef.name}`,
      uploadedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      nsfw: false,
      sensitive: false,
      likeCount: 0,
      shareCount: 0,
      downloadCount: 0,
      popularityScore: 0,
      language: "en",
      templateName: "",
      overlay:
        i === 0
          ? {
              avatar: "https://i.pravatar.cc/40?img=5",
              name: "Tiffany Gleason",
            }
          : null,
    };

    await setDoc(doc(db, "memes", fileNameWithoutExt), memeDoc);
    console.log(`✓ ${itemRef.name} → memes/${fileNameWithoutExt}`);
  }

  console.log("\nDone! Firestore seeded successfully.");
}

seedFirestore().catch(console.error);
