/**
 * seedProfileAssets.ts
 *
 * Seeds preset profile assets (avatars & banners) into Firebase Storage
 * and Firestore `profileAssets` collection.
 *
 * Follows PROFILE_SCHEMA_SPEC.md exactly.
 *
 * Usage:
 *   npx tsx scripts/seedProfileAssets.ts
 *
 * Behavior:
 *   - Idempotent: safe to run multiple times.
 *   - Preserves `createdAt` if a document already exists.
 *   - Always updates `updatedAt`.
 *   - Enforces single-default invariant per asset kind.
 */

import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { imageSize } from "image-size";

// ── Firebase config (matches existing scripts) ──────────────────────────────

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

// ── Constants ───────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATARS_DIR = path.resolve(__dirname, "../src/assets/profile/avatars");
const BANNERS_DIR = path.resolve(__dirname, "../src/assets/profile/banners");

const COLLECTION = "profileAssets";

const ACCEPTED_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// ── Types (matching PROFILE_SCHEMA_SPEC.md) ─────────────────────────────────

type ProfileAssetKind = "avatar" | "banner";

interface ProfileAssetDoc {
  id: string;
  kind: ProfileAssetKind;
  ownership: "preset";
  label: string;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  category: string;
  tags: string[];
  sortOrder: number;
  isDefault: boolean;
  uploadedBy: null;
  status: "approved";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Read intrinsic dimensions from an image buffer. */
function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  try {
    const dims = imageSize(buffer) as { width?: number; height?: number };
    return { width: dims.width ?? 0, height: dims.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

/**
 * Derive a human-readable label from a filename.
 *   "1.jpeg"       → "Avatar 1" / "Banner 1"
 *   "cool-cat.png" → "Cool Cat"
 */
function deriveLabel(fileName: string, kind: ProfileAssetKind): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");

  // If the name is purely numeric, use "Avatar N" / "Banner N"
  if (/^\d+$/.test(withoutExt)) {
    const kindLabel = kind === "avatar" ? "Avatar" : "Banner";
    return `${kindLabel} ${withoutExt}`;
  }

  // Otherwise, title-case from kebab/snake/space separators
  return withoutExt
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Build a deterministic document ID.
 *   kind "avatar", index 0 → "preset-avatar-001"
 *   kind "banner", index 2 → "preset-banner-003"
 */
function buildDocId(kind: ProfileAssetKind, index: number): string {
  const num = String(index + 1).padStart(3, "0");
  return `preset-${kind}-${num}`;
}

/** List and sort image files in a directory. Stable numeric then alpha sort. */
function listImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => ACCEPTED_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
}

// ── Core seeding logic ──────────────────────────────────────────────────────

interface SeedResult {
  docId: string;
  fileName: string;
  storagePath: string;
  kind: ProfileAssetKind;
  isDefault: boolean;
  width: number;
  height: number;
  status: "created" | "updated";
}

async function seedAssets(
  dir: string,
  kind: ProfileAssetKind,
): Promise<{ results: SeedResult[]; errors: string[] }> {
  const files = listImageFiles(dir);
  const results: SeedResult[] = [];
  const errors: string[] = [];

  if (files.length === 0) {
    console.log(`  No ${kind} files found in ${dir}`);
    return { results, errors };
  }

  console.log(`  Found ${files.length} ${kind} file(s) in ${dir}\n`);

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(dir, fileName);
    const docId = buildDocId(kind, i);
    const storagePath = `profile-assets/presets/${kind}s/${fileName}`;
    const isDefault = i === 0; // First sorted file is the default

    try {
      // 1. Read file and get dimensions
      const fileBuffer = fs.readFileSync(filePath);
      const { width, height } = getImageDimensions(fileBuffer);

      if (width === 0 || height === 0) {
        errors.push(
          `${fileName}: could not read dimensions (${width}x${height})`,
        );
        // Still continue — store with 0 dimensions and flag the error
      }

      // 2. Upload to Firebase Storage
      const ext = path.extname(fileName).toLowerCase();
      const contentType = MIME_MAP[ext] ?? "application/octet-stream";
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, fileBuffer, { contentType });
      const url = await getDownloadURL(storageRef);

      // 3. Check if Firestore doc already exists (to preserve createdAt)
      const docRef = doc(db, COLLECTION, docId);
      const existingSnap = await getDoc(docRef);
      const existingData = existingSnap.exists() ? existingSnap.data() : null;
      const wasExisting = existingSnap.exists();

      const createdAt = existingData?.createdAt ?? Timestamp.now();
      const updatedAt = Timestamp.now();

      // 4. Build document per PROFILE_SCHEMA_SPEC.md
      const label = deriveLabel(fileName, kind);
      const category = isDefault ? "default" : "general";

      const assetDoc: ProfileAssetDoc = {
        id: docId,
        kind,
        ownership: "preset",
        label,
        url,
        storagePath,
        width,
        height,
        category,
        tags: [],
        sortOrder: i,
        isDefault,
        uploadedBy: null,
        status: "approved",
        createdAt,
        updatedAt,
      };

      // 5. Write to Firestore (setDoc = create or overwrite)
      await setDoc(docRef, assetDoc);

      results.push({
        docId,
        fileName,
        storagePath,
        kind,
        isDefault,
        width,
        height,
        status: wasExisting ? "updated" : "created",
      });

      const marker = isDefault ? " ★ DEFAULT" : "";
      const action = wasExisting ? "updated" : "created";
      console.log(
        `  ✓ ${fileName} → ${storagePath} → ${docId} (${width}x${height}) [${action}]${marker}`,
      );
    } catch (err) {
      const msg = `${fileName}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`  ✗ ${fileName} failed: ${msg}`);
    }
  }

  return { results, errors };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Memetrest — Seed Preset Profile Assets");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Seed avatars
  console.log("── Avatars ──────────────────────────────────────────────\n");
  const avatarResult = await seedAssets(AVATARS_DIR, "avatar");

  console.log("");

  // Seed banners
  console.log("── Banners ──────────────────────────────────────────────\n");
  const bannerResult = await seedAssets(BANNERS_DIR, "banner");

  // ── Summary report ──────────────────────────────────────────────────

  const allResults = [...avatarResult.results, ...bannerResult.results];
  const allErrors = [...avatarResult.errors, ...bannerResult.errors];
  const created = allResults.filter((r) => r.status === "created");
  const updated = allResults.filter((r) => r.status === "updated");
  const defaults = allResults.filter((r) => r.isDefault);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Summary");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`  Files processed:   ${allResults.length}`);
  console.log(`    Avatars:         ${avatarResult.results.length}`);
  console.log(`    Banners:         ${bannerResult.results.length}`);
  console.log(`  Documents created: ${created.length}`);
  console.log(`  Documents updated: ${updated.length}`);
  console.log(`  Errors:            ${allErrors.length}`);

  console.log("\n  Storage paths written:");
  for (const r of allResults) {
    console.log(`    ${r.storagePath}`);
  }

  console.log("\n  Firestore document IDs:");
  for (const r of allResults) {
    console.log(`    ${r.docId} (${r.kind}, ${r.width}x${r.height})`);
  }

  console.log("\n  Default assets:");
  for (const d of defaults) {
    console.log(`    ★ ${d.docId} (${d.kind}) — ${d.fileName}`);
  }

  if (allErrors.length > 0) {
    console.log("\n  Errors:");
    for (const e of allErrors) {
      console.log(`    ✗ ${e}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Done!");
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(allErrors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
