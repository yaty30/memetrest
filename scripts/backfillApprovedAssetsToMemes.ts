import admin from "firebase-admin";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, unlinkSync, writeFileSync } from "fs";

const PROJECT_ID = "memetrest-b57dc";

// Firebase CLI OAuth client (public, from open-source firebase-tools)
const FIREBASE_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;

const configPath = join(
  homedir(),
  ".config",
  "configstore",
  "firebase-tools.json",
);
const config = JSON.parse(readFileSync(configPath, "utf-8"));

const adcPath = join(homedir(), ".config", "_tmp_adc_backfill_approved.json");
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
const Timestamp = admin.firestore.Timestamp;

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (typeof value !== "object" || value === null) return null;
  return value as AnyRecord;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown): boolean {
  return Boolean(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toMillis(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value instanceof Timestamp) return value.toMillis();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return fallback;
}

function normalizeTags(value: unknown): string[] {
  return Array.from(
    new Set(
      asStringArray(value).map((tag) => tag.toLowerCase()).filter(Boolean),
    ),
  );
}

async function runBackfill() {
  console.log(
    DRY_RUN
      ? "DRY RUN: no writes will be performed.\n"
      : "LIVE RUN: applying writes.\n",
  );

  const approvedAssetsSnap = await db
    .collection("assets")
    .where("moderation.finalDecision", "==", "approved")
    .get();

  if (approvedAssetsSnap.empty) {
    console.log("No assets with moderation.finalDecision='approved' found.");
    return;
  }

  console.log(`Found ${approvedAssetsSnap.size} approved asset(s).`);

  let assetsPatched = 0;
  let memesUpserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const assetSnap of approvedAssetsSnap.docs) {
    const assetId = assetSnap.id;
    const now = Date.now();
    const nowTs = Timestamp.fromMillis(now);

    try {
      const assetData = assetSnap.data() as AnyRecord;
      const moderation = asRecord(assetData.moderation);
      const dimensions = asRecord(assetData.dimensions);
      const urls = asRecord(assetData.urls);
      const storage = asRecord(assetData.storage);

      const needsAssetPatch =
        asString(assetData.status) !== "published" ||
        asString(assetData.visibility) !== "public";

      const memeRef = db.collection("memes").doc(assetId);
      const memeSnap = await memeRef.get();
      const existingMeme = memeSnap.exists ? (memeSnap.data() as AnyRecord) : {};
      const needsMemeUpsert =
        !memeSnap.exists || asString(existingMeme.status) !== "approved";

      if (!needsAssetPatch && !needsMemeUpsert) {
        skipped += 1;
        continue;
      }

      const title = asString(assetData.title).trim() || "Untitled";
      const description = asString(assetData.description).trim();
      const tags = normalizeTags(assetData.tags);
      const scanResult = asString(moderation?.scanResult).toLowerCase();
      const mimeType = asString(assetData.mimeType) || "image/jpeg";
      const animated =
        asBool(assetData.isAnimated) || mimeType.toLowerCase() === "image/gif";

      const width = asNumber(dimensions?.width, asNumber(existingMeme.width, 480));
      const height = asNumber(
        dimensions?.height,
        asNumber(existingMeme.height, 320),
      );
      const aspectRatio = asNumber(
        dimensions?.aspectRatio,
        height > 0 ? width / height : 1,
      );

      const imageUrl =
        asString(urls?.previewUrl) ||
        asString(urls?.originalUrl) ||
        asString(urls?.thumbnailUrl) ||
        asString(existingMeme.imageUrl);

      const thumbnailUrl =
        asString(urls?.thumbnailUrl) || asString(existingMeme.thumbnailUrl);
      const storagePath =
        asString(storage?.originalPath) || asString(existingMeme.storagePath);
      const createdAtMillis = toMillis(assetData.createdAt, now);
      const reviewedAtMillis = toMillis(
        moderation?.reviewedAt,
        toMillis(existingMeme.moderatedAt, now),
      );
      const publishedAtMillis = toMillis(
        assetData.publishedAt,
        toMillis(existingMeme.publishedAt, now),
      );

      const memeUpdate: AnyRecord = {
        id: assetId,
        title,
        description,
        tags,
        searchKeywords: tags,
        category: asString(existingMeme.category) || "uncategorized",
        templateName: asString(existingMeme.templateName),
        language: asString(existingMeme.language) || "en",
        imageUrl,
        storagePath,
        mimeType,
        animated,
        thumbnailUrl: thumbnailUrl || null,
        width,
        height,
        aspectRatio,
        nsfw: scanResult === "explicit",
        sensitive: asBool(moderation?.userSensitiveFlag),
        status: "approved",
        uploadedBy:
          asString(assetData.ownerId) || asString(existingMeme.uploadedBy) || null,
        moderatedBy:
          asString(moderation?.reviewedBy) ||
          asString(existingMeme.moderatedBy) ||
          null,
        moderatedAt: Timestamp.fromMillis(reviewedAtMillis),
        publishedAt: Timestamp.fromMillis(publishedAtMillis),
        updatedAt: nowTs,
        likeCount: asNumber(existingMeme.likeCount, 0),
        shareCount: asNumber(existingMeme.shareCount, 0),
        downloadCount: asNumber(existingMeme.downloadCount, 0),
        popularityScore: asNumber(existingMeme.popularityScore, 0),
      };

      if (!existingMeme.createdAt) {
        memeUpdate.createdAt = Timestamp.fromMillis(createdAtMillis);
      }
      if (!existingMeme.uploadedAt) {
        memeUpdate.uploadedAt = Timestamp.fromMillis(createdAtMillis);
      }

      if (!DRY_RUN) {
        const batch = db.batch();

        if (needsAssetPatch) {
          batch.set(
            assetSnap.ref,
            {
              status: "published",
              visibility: "public",
              moderation: {
                finalDecision: "approved",
                reviewedAt: moderation?.reviewedAt ?? nowTs,
                reviewedBy: moderation?.reviewedBy ?? null,
                decidedAt: moderation?.decidedAt ?? nowTs,
                decidedBy: moderation?.decidedBy ?? moderation?.reviewedBy ?? null,
              },
              publishedAt: assetData.publishedAt ?? nowTs,
              updatedAt: nowTs,
            },
            { merge: true },
          );
          assetsPatched += 1;
        }

        if (needsMemeUpsert) {
          batch.set(memeRef, memeUpdate, { merge: true });
          memesUpserted += 1;
        }

        await batch.commit();
      } else {
        if (needsAssetPatch) assetsPatched += 1;
        if (needsMemeUpsert) memesUpserted += 1;
      }

      console.log(
        `${DRY_RUN ? "[dry-run] would patch" : "patched"} ${assetId} :: asset=${needsAssetPatch} meme=${needsMemeUpsert}`,
      );
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`failed ${assetId}: ${message}`);
    }
  }

  console.log(
    `\nDone. Assets patched: ${assetsPatched}, Memes upserted: ${memesUpserted}, Skipped: ${skipped}, Failed: ${failed}`,
  );
}

runBackfill()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      unlinkSync(adcPath);
    } catch {
      // no-op
    }
  });
