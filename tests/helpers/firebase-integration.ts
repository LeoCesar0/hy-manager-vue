import { vi } from "vitest";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9_VI7y4eueZ54TzyPXxr-r7cMX6sOZt8",
  authDomain: "hyfinances-1532e.firebaseapp.com",
  projectId: "hyfinances-1532e",
  storageBucket: "hyfinances-1532e.firebasestorage.app",
  messagingSenderId: "632145740844",
  appId: "1:632145740844:web:05563195d95236b85ffd89",
  measurementId: "G-JPBBW1LKVF",
};

let app: FirebaseApp;
let db: Firestore;

/**
 * Initializes a real Firebase connection for integration tests.
 * No authentication required — Firestore rules allow open access on `env/test/`.
 *
 * Call in a `beforeAll` block.
 */
export const setupFirebaseIntegration = () => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0] as FirebaseApp;
  }
  db = getFirestore(app);

  // Stub useFirebaseStore globally so all firebase services work
  vi.stubGlobal("useFirebaseStore", () => ({
    firebaseDB: db,
    firebaseAuth: null,
    firebaseStorage: null,
    currentFirebaseUser: { value: null },
  }));

  // Stub defineStore (auto-imported by Nuxt) — not needed at runtime
  // but some transitive imports may reference it
  vi.stubGlobal("defineStore", (key: string, fn: () => unknown) => fn);

  return { app, db };
};

type CollectionName =
  | "transactions"
  | "categories"
  | "creditors"
  | "bankAccounts"
  | "reports";

/**
 * Deletes all documents from a collection under `env/test/`.
 * Use in `afterEach` or `afterAll` to clean up test data.
 */
export const cleanupCollection = async ({
  collectionName,
}: {
  collectionName: CollectionName;
}) => {
  const ref = collection(db, `env/test/${collectionName}`);
  const snapshot = await getDocs(ref);
  const deletes = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletes);
};

/**
 * Cleans up all collections used by sync integration tests.
 */
export const cleanupAllTestCollections = async () => {
  await Promise.all([
    cleanupCollection({ collectionName: "transactions" }),
    cleanupCollection({ collectionName: "categories" }),
    cleanupCollection({ collectionName: "creditors" }),
    cleanupCollection({ collectionName: "bankAccounts" }),
    cleanupCollection({ collectionName: "reports" }),
  ]);
};
