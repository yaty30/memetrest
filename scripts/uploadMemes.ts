import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { normalizeTagList } from "../src/utils/tagNormalization";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const MEMES_DIR = path.resolve(__dirname, "../src/assets/memes");

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const ACCEPTED_EXTS = new Set(Object.keys(MIME_MAP));

const HEIGHTS = [
  220, 300, 260, 420, 400, 240, 380, 300, 360, 280, 340, 320, 350, 270, 310,
];

/** Pick a varied height based on index, cycling through the pool. */
function pickHeight(index: number): number {
  return HEIGHTS[index % HEIGHTS.length];
}

function generateTags(title: string): string[] {
  return normalizeTagList(
    title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

function generateSearchKeywords(
  title: string,
  tags: string[],
  category: string,
  description: string,
): string[] {
  const keywords = new Set<string>();
  const allText = [title, ...tags, category, description].join(" ");
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

/** Derive a readable title from the filename (strip ext, GIF source suffixes, clean up). */
function deriveTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  // Clean up GIF naming patterns like "Dance Dancing GIF by Someone"
  const cleaned = withoutExt.replace(/\s*GIF\s*(by\s+.*)?$/i, "").trim();
  return cleaned || withoutExt;
}

async function uploadAllMemes() {
  const files = fs
    .readdirSync(MEMES_DIR)
    .filter((f) => ACCEPTED_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => parseInt(a) - parseInt(b));

  console.log(`Found ${files.length} images to upload...\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(MEMES_DIR, file);
    const storageRef = ref(storage, `memes/${file}`);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME_MAP[ext] ?? "image/jpeg";
    const isGif = ext === ".gif";
    const fileNameWithoutExt = file.replace(/\.[^.]+$/, "");
    const title = deriveTitle(file);
    const tags = generateTags(title);
    const category = "uncategorized";
    const searchKeywords = generateSearchKeywords(title, tags, category, "");

    try {
      await uploadBytes(storageRef, fileBuffer, { contentType });
      const url = await getDownloadURL(storageRef);

      await setDoc(doc(db, "memes", fileNameWithoutExt), {
        title,
        description: "",
        tags,
        category,
        searchKeywords,
        height: pickHeight(i),
        width: 0,
        imageUrl: url,
        storagePath: `memes/${file}`,
        mimeType: contentType,
        animated: isGif,
        thumbnailUrl: null,
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
        overlay: null,
      });

      console.log(`✓ ${file} → Storage + Firestore`);
    } catch (err) {
      console.error(`✗ ${file} failed:`, err);
    }
  }

  console.log("\nDone!");
}

uploadAllMemes();
