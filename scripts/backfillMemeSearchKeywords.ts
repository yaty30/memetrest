import admin from "firebase-admin";
import { buildSearchKeywordsFromTags } from "../src/utils/searchKeywords";

const APPLY = process.argv.includes("--apply");
const DRY_RUN = !APPLY;
const PAGE_SIZE = 300;

type AnyRecord = Record<string, unknown>;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function runBackfill(): Promise<void> {
  console.log(
    DRY_RUN
      ? "DRY RUN: no writes will be performed."
      : "LIVE RUN: applying updates.",
  );

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let query = db
      .collection("memes")
      .where("status", "==", "approved")
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snap = await query.get();
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      scanned += 1;
      const data = docSnap.data() as AnyRecord;
      const tags = asStringArray(data.tags);
      const expectedKeywords = buildSearchKeywordsFromTags(tags);
      const existingKeywords = asStringArray(data.searchKeywords);

      if (sameStringArray(existingKeywords, expectedKeywords)) {
        skipped += 1;
        continue;
      }

      if (!DRY_RUN) {
        await docSnap.ref.set({ searchKeywords: expectedKeywords }, { merge: true });
      }

      updated += 1;
      console.log(
        `${DRY_RUN ? "[dry-run] would update" : "updated"} memes/${docSnap.id}`,
      );
    }

    cursor = snap.docs[snap.docs.length - 1];
  }

  console.log(
    `Done. Scanned: ${scanned}, Updated: ${updated}, Unchanged: ${skipped}`,
  );
}

runBackfill().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
