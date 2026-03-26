import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

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
const db = getFirestore(app);

const FIREBASE_STORAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "memetrest-b57dc.firebasestorage.app",
];

function isExternalUrl(url: string): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return !FIREBASE_STORAGE_HOSTS.some((host) => hostname.includes(host));
  } catch {
    return false;
  }
}

async function removeExternalGifs() {
  const memesCol = collection(db, "memes");
  const snapshot = await getDocs(memesCol);

  console.log(`Found ${snapshot.size} total memes in Firestore.\n`);

  let deleted = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const imageUrl: string = data.imageUrl ?? "";
    const animated: boolean = data.animated ?? false;

    if (animated && isExternalUrl(imageUrl)) {
      console.log(
        `Deleting: ${docSnap.id} — ${data.title ?? "Untitled"} (${imageUrl})`,
      );
      await deleteDoc(doc(db, "memes", docSnap.id));
      deleted++;
    }
  }

  console.log(`\nDone. Deleted ${deleted} externally-hosted GIF(s).`);
}

removeExternalGifs().catch(console.error);
