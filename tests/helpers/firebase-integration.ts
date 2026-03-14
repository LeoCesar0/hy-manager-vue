import { vi } from "vitest";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const parseEnvFile = (filePath: string): Record<string, string> => {
  const content = readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  return env;
};

const env = parseEnvFile(resolve(process.cwd(), ".env.test"));

const firebaseConfig = {
  apiKey: env.NUXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NUXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
