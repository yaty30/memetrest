import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

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

function generateTags(title: string): string[] {
  return title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

async function uploadAllMemes() {
  const files = fs
    .readdirSync(MEMES_DIR)
    .filter((f) => ACCEPTED_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => parseInt(a) - parseInt(b));

  console.log(`Found ${files.length} images to upload...\n`);

  for (const file of files) {
    const filePath = path.join(MEMES_DIR, file);
    const storageRef = ref(storage, `memes/${file}`);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME_MAP[ext] ?? "image/jpeg";
    const isGif = ext === ".gif";
    const fileNameWithoutExt = file.replace(/\.[^.]+$/, "");
    const title = `Image ${fileNameWithoutExt}`;

    try {
      await uploadBytes(storageRef, fileBuffer, { contentType });
      const url = await getDownloadURL(storageRef);

      await setDoc(doc(db, "memes", fileNameWithoutExt), {
        title,
        description: "",
        tags: generateTags(title),
        category: "uncategorized",
        height: 300,
        width: 0,
        imageUrl: url,
        storagePath: `memes/${file}`,
        mimeType: contentType,
        animated: isGif,
        thumbnailUrl: null,
        uploadedAt: Timestamp.now(),
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
