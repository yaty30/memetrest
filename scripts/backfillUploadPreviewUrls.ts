import admin from "firebase-admin";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const PROJECT_ID = "memetrest-b57dc";

// Firebase CLI OAuth client (public, from open-source firebase-tools)
const FIREBASE_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

// Read Firebase CLI stored credentials
const configPath = join(
  homedir(),
  ".config",
  "configstore",
  "firebase-tools.json",
);
const config = JSON.parse(readFileSync(configPath, "utf-8"));

// Write a temporary ADC file so admin SDK can use it
const adcPath = join(homedir(), ".config", "_tmp_adc_backfill.json");
writeFileSync(
  adcPath,
  JSON.stringify({
    type: "authorized_user",
    client_id: FIREBASE_CLIENT_ID,
    client_secret: FIREBASE_CLIENT_SECRET,
    refresh_token: config.tokens.refresh_token,
  }),
);
process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;

admin.initializeApp({ projectId: PROJECT_ID });

const db = admin.firestore();
const bucket = admin.storage().bucket(`${PROJECT_ID}.firebasestorage.app`);

const DRY_RUN = process.argv.includes("--dry-run");

function isValidTokenUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  return url.includes("alt=media") && url.includes("token=");
}

function resolveStoragePath(data: Record<string, unknown>): string | null {
  // Prefer structured storage.originalPath
  const storage = data.storage as Record<string, unknown> | undefined;
  if (
    storage &&
    typeof storage.originalPath === "string" &&
    storage.originalPath
  ) {
    return storage.originalPath;
  }
  // Fallback to top-level fields
  for (const field of ["storagePath", "finalPath", "quarantinePath"]) {
    const val = data[field];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

async function backfill() {
  console.log(DRY_RUN ? "🔍 DRY RUN — no writes\n" : "🔧 LIVE RUN\n");

  const snapshot = await db.collection("assets").get();
  console.log(`Found ${snapshot.size} asset docs.\n`);

  let updated = 0;
  let skipped = 0;
  let errored = 0;

  for (const docSnap of snapshot.docs) {
    const id = docSnap.id;
    const data = docSnap.data();

    // Check if urls.originalUrl is already a working tokenized URL
    const urls = (data.urls ?? {}) as Record<string, unknown>;
    if (isValidTokenUrl(urls.originalUrl)) {
      skipped++;
      continue;
    }

    // Resolve the Storage path for the original file
    const storagePath = resolveStoragePath(data);
    if (!storagePath) {
      console.log(`  ⚠ ${id}: no storage path found — skipping`);
      errored++;
      continue;
    }

    try {
      const file = bucket.file(storagePath);
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`  ⚠ ${id}: file not found at "${storagePath}" — skipping`);
        errored++;
        continue;
      }

      const [metadata] = await file.getMetadata();
      let token =
        (metadata.metadata as Record<string, string> | undefined)
          ?.firebaseStorageDownloadTokens ?? null;

      // Generate a token if none exists
      if (!token) {
        token = randomUUID();
        if (!DRY_RUN) {
          await file.setMetadata({
            metadata: { firebaseStorageDownloadTokens: token },
          });
        }
      }

      const originalUrl = [
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`,
        `${encodeURIComponent(storagePath)}?alt=media&token=${token}`,
      ].join("");

      if (!DRY_RUN) {
        await docSnap.ref.update({
          "urls.originalUrl": originalUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      updated++;
      console.log(`  ✔ ${id}: ${DRY_RUN ? "would set" : "set"} originalUrl`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✖ ${id}: ${msg}`);
      errored++;
    }
  }

  console.log(
    `\nDone. Updated: ${updated}, Skipped (already ok): ${skipped}, Errors: ${errored}`,
  );
}

backfill()
  .catch(console.error)
  .finally(() => {
    try {
      unlinkSync(adcPath);
    } catch {}
  });
