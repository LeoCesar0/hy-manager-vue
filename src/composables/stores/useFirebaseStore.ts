import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { firebaseDelete } from "~/services/firebase/firebaseDelete";
import { firebaseList } from "~/services/firebase/firebaseList";
import { firebaseGetWhere } from "~/services/firebase/firebaseGetWhere";
import { firebasePaginatedList } from "~/services/firebase/firebasePaginatedList";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { makeStoreKey } from "~/helpers/makeStoreKey";

export const useFirebaseStore = defineStore(makeStoreKey("firebase"), () => {
  let firebaseApp: FirebaseApp;

  const config = useRuntimeConfig();

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId,
  };

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }

  const firebaseAuth = getAuth(firebaseApp);
  const firebaseDB = getFirestore(firebaseApp);
  const firebaseStorage = getStorage(firebaseApp);

  return {
    // Auth
    firebaseAuth: firebaseAuth,

    // Firestore
    firebaseDB: firebaseDB,

    // Storage
    firebaseStorage: firebaseStorage,

    // CRUD operations
    create: firebaseCreate,
    get: firebaseGet,
    update: firebaseUpdate,
    delete: firebaseDelete,
    list: firebaseList,
    getWhere: firebaseGetWhere,
    getPaginatedList: firebasePaginatedList,
  };
});
