import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { imageSize } from "image-size";
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

const GIF_DIR = path.resolve(__dirname, "../src/assets/memes/gif");

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

function deriveTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt.replace(/\s*GIF\s*(by\s+.*)?$/i, "").trim();
  return cleaned || withoutExt;
}

async function seedGifs() {
  const files = fs
    .readdirSync(GIF_DIR)
    .filter((f) => path.extname(f).toLowerCase() === ".gif")
    .sort((a, b) => parseInt(a) - parseInt(b));

  console.log(`Found ${files.length} GIFs in ${GIF_DIR}. Uploading...\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(GIF_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);

    let width = 0;
    let height = 0;
    try {
      const dims = imageSize(fileBuffer) as { width?: number; height?: number };
      width = dims.width || 0;
      height = dims.height || 0;
    } catch {
      console.warn(`Could not read dimensions for ${file}, defaulting to 0x0`);
    }

    const fileNameWithoutExt = file.replace(/\.[^.]+$/, "");
    const storagePath = `memes/${file}`;
    const storageRef = ref(storage, storagePath);
    const title = deriveTitle(file);
    const tags = generateTags(title);
    const category = "uncategorized";
    const searchKeywords = generateSearchKeywords(title, tags, category, "");

    try {
      await uploadBytes(storageRef, fileBuffer, {
        contentType: "image/gif",
      });
      const imageUrl = await getDownloadURL(storageRef);

      await setDoc(doc(db, "memes", fileNameWithoutExt), {
        title,
        description: "",
        tags,
        category,
        searchKeywords,
        height,
        width,
        imageUrl,
        storagePath,
        mimeType: "image/gif",
        animated: true,
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

      console.log(
        `✓ ${file} → Storage + Firestore (memes/${fileNameWithoutExt})`,
      );
    } catch (err) {
      console.error(`✗ ${file} failed:`, err);
    }
  }

  console.log("\nDone! GIF memes seeded successfully.");
}

seedGifs().catch(console.error);
