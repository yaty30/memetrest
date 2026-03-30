import admin from "firebase-admin";
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
const adcPath = join(homedir(), ".config", "_tmp_adc.json");
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

async function patchAllMemesToApproved() {
  const snapshot = await db.collection("memes").get();

  console.log(`Found ${snapshot.size} memes. Patching status → "approved"...`);

  let updated = 0;
  let skipped = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.status === "approved") {
      skipped++;
      continue;
    }
    await docSnap.ref.update({ status: "approved" });
    updated++;
    console.log(`  ✔ ${docSnap.id} (was "${data.status ?? "<missing>"}")`);
  }

  console.log(`\nDone. Updated: ${updated}, Already approved: ${skipped}`);
}

patchAllMemesToApproved()
  .catch(console.error)
  .finally(() => {
    try {
      unlinkSync(adcPath);
    } catch {}
  });
