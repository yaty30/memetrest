import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  listAll,
  deleteObject,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { imageSize } from "image-size";
import { normalizeTagList } from "../src/utils/tagNormalization.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration matching the other scripts
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

async function clearFirestore() {
  console.log("Clearing Firestore 'memes' collection...");
  const memesCol = collection(db, "memes");
  const snapshot = await getDocs(memesCol);

  if (snapshot.empty) {
    console.log("Firestore collection is already empty.");
    return;
  }

  let count = 0;
  for (const dbDoc of snapshot.docs) {
    await deleteDoc(dbDoc.ref);
    count++;
  }
  console.log(`✓ Deleted ${count} documents from Firestore.`);
}

async function clearStorage() {
  console.log("Clearing Firebase Storage 'memes/' folder...");
  const memesFolderRef = ref(storage, "memes");

  try {
    const listResult = await listAll(memesFolderRef);
    if (listResult.items.length === 0) {
      console.log("Storage folder is already empty.");
      return;
    }

    let count = 0;
    for (const itemRef of listResult.items) {
      await deleteObject(itemRef);
      count++;
    }
    console.log(`✓ Deleted ${count} files from Storage.`);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "storage/object-not-found"
    ) {
      console.log("Storage folder doesn't exist or is empty.");
    } else {
      throw error;
    }
  }
}

async function uploadAndSeed() {
  if (!fs.existsSync(MEMES_DIR)) {
    console.error(`Local memes folder not found at: ${MEMES_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(MEMES_DIR)
    .filter((f) => ACCEPTED_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => {
      // Try to parse numbers from strictly numeric filenames like "01.gif" vs "2.gif"
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

  console.log(`\nFound ${files.length} images to upload...\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(MEMES_DIR, file);

    const storageRef = ref(storage, `memes/${file}`);
    const fileBuffer = fs.readFileSync(filePath);

    // Extract actual dimensions
    let dimensions: ReturnType<typeof imageSize> | null = null;
    try {
      dimensions = imageSize(fileBuffer);
    } catch (err) {
      console.warn(
        `Could not read dimensions for ${file}, skipping or using defaults:`,
        err,
      );
    }

    const width = dimensions?.width ?? 0;
    const height = dimensions?.height ?? 0;
    const aspectRatio = height > 0 ? width / height : 1;

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

      const dbDoc = {
        title,
        description: "",
        tags,
        category,
        searchKeywords,

        // Exact metrics from the file
        width,
        height,
        aspectRatio,

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
        status: "approved",
      };

      await setDoc(doc(db, "memes", fileNameWithoutExt), dbDoc);

      console.log(
        `✓ ${file} → Storage + Firestore (Dimensions: ${width}x${height})`,
      );
    } catch (err) {
      console.error(`✗ ${file} failed:`, err);
    }
  }

  console.log("\nDone seeding!");
}

async function run() {
  try {
    console.log("Starting Reset & Reseed Process...\n");
    await clearFirestore();
    await clearStorage();
    await uploadAndSeed();
    console.log("\nSuccessfully finished the reset and reseed process!");
    process.exit(0);
  } catch (error) {
    console.error("Failed during reset/reseed process:", error);
    process.exit(1);
  }
}

run();
