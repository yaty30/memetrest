import admin from "firebase-admin";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, unlinkSync, writeFileSync } from "fs";

const PROJECT_ID = "memetrest-b57dc";
const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;

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

const adcPath = join(homedir(), ".config", "_tmp_adc_meme_like_count.json");
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

async function backfillMemeLikeCount() {
  console.log(
    DRY_RUN
      ? "DRY RUN: no writes will be performed."
      : "LIVE RUN: applying writes.",
  );

  const snapshot = await db.collection("memes").get();
  if (snapshot.empty) {
    console.log("No meme documents found.");
    return;
  }

  let patched = 0;
  let skipped = 0;

  for (const memeDoc of snapshot.docs) {
    const data = memeDoc.data();
    if (typeof data.likeCount === "number" && Number.isFinite(data.likeCount)) {
      skipped += 1;
      continue;
    }

    patched += 1;
    if (!DRY_RUN) {
      await memeDoc.ref.set({ likeCount: 0 }, { merge: true });
    }
  }

  console.log(
    `${DRY_RUN ? "Would patch" : "Patched"} ${patched} meme docs. Skipped ${skipped} docs with existing likeCount.`,
  );
}

backfillMemeLikeCount()
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
