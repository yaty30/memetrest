import admin from "firebase-admin";
import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const PROJECT_ID = "memetrest-b57dc";

// Firebase CLI OAuth client (public, from open-source firebase-tools)
const FIREBASE_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const configPath = join(
  homedir(),
  ".config",
  "configstore",
  "firebase-tools.json",
);
const config = JSON.parse(readFileSync(configPath, "utf-8"));

const adcPath = join(homedir(), ".config", "_tmp_adc_pending_review_patch.json");
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
const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;

async function runPatch() {
  console.log(
    DRY_RUN
      ? "DRY RUN: no writes will be performed.\n"
      : "LIVE RUN: applying writes.\n",
  );

  const snapshot = await db
    .collection("assets")
    .where("status", "==", "uploaded")
    .get();

  if (snapshot.empty) {
    console.log("No assets found with status='uploaded'.");
    return;
  }

  console.log(`Found ${snapshot.size} asset(s) with status='uploaded'.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const now = Date.now();
  const nowTimestamp = admin.firestore.Timestamp.fromMillis(now);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const assetId = docSnap.id;
    const currentStatus = data.status;

    if (currentStatus !== "uploaded") {
      skipped += 1;
      continue;
    }

    try {
      if (!DRY_RUN) {
        const eventRef = docSnap.ref.collection("events").doc();
        await db.runTransaction(async (tx) => {
          tx.set(
            docSnap.ref,
            {
              status: "pending_review",
              updatedAt: nowTimestamp,
            },
            { merge: true },
          );

          tx.set(eventRef, {
            id: eventRef.id,
            assetId,
            actorId: data.ownerId ?? null,
            type: "submitted_for_review",
            note: "Backfill: migrated uploaded -> pending_review",
            metadata: {
              reasonCode: null,
              fromStatus: "uploaded",
              toStatus: "pending_review",
            },
            createdAt: nowTimestamp,
          });
        });
      }

      updated += 1;
      console.log(
        `${DRY_RUN ? "[dry-run] would update" : "updated"} asset ${assetId}`,
      );
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error ? error.message : "Unknown migration error";
      console.log(`failed asset ${assetId}: ${message}`);
    }
  }

  console.log(
    `\nDone. Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`,
  );
}

runPatch()
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
