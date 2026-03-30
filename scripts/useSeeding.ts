import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { imageSize } from "image-size";
import { normalizeTagList } from "../src/utils/tagNormalization";

/* ── Firebase singleton ── */

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

/* ── MIME helpers ── */

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const ACCEPTED_EXTS = new Set(Object.keys(MIME_MAP));

/* ── Shared helpers ── */

export function getImageDimensions(buffer: Buffer): {
  width: number;
  height: number;
} {
  try {
    const dims = imageSize(buffer) as { width?: number; height?: number };
    return { width: dims.width || 0, height: dims.height || 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

export function deriveTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt.replace(/\s*GIF\s*(by\s+.*)?$/i, "").trim();
  return cleaned || withoutExt;
}

export function generateTags(title: string): string[] {
  return normalizeTagList(
    title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

export function generateSearchKeywords(
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

/* ── Core seeding function ── */

export interface SeedOptions {
  /** Absolute path to the directory containing image files. */
  directory: string;
  /** Only process files with these extensions. Defaults to all accepted types. */
  extensions?: string[];
  /** Label printed in console output. */
  label?: string;
}

export async function seedFromDirectory({
  directory,
  extensions,
  label = "images",
}: SeedOptions): Promise<void> {
  const allowedExts = extensions
    ? new Set(extensions.map((e) => (e.startsWith(".") ? e : `.${e}`)))
    : ACCEPTED_EXTS;

  const files = fs
    .readdirSync(directory)
    .filter((f) => allowedExts.has(path.extname(f).toLowerCase()))
    .sort((a, b) => parseInt(a) - parseInt(b));

  console.log(`Found ${files.length} ${label} in ${directory}. Uploading...\n`);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME_MAP[ext] ?? "application/octet-stream";
    const isGif = ext === ".gif";
    const fileNameWithoutExt = file.replace(/\.[^.]+$/, "");
    const storagePath = `memes/${file}`;
    const storageRef = ref(storage, storagePath);

    const { width, height } = getImageDimensions(fileBuffer);
    const title = deriveTitle(file);
    const tags = generateTags(title);
    const category = "uncategorized";
    const searchKeywords = generateSearchKeywords(title, tags, category, "");

    try {
      await uploadBytes(storageRef, fileBuffer, { contentType });
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
      });

      console.log(
        `✓ ${file} → Storage + Firestore (memes/${fileNameWithoutExt})`,
      );
    } catch (err) {
      console.error(`✗ ${file} failed:`, err);
    }
  }

  console.log(`\nDone! ${label} seeded successfully.`);
}
