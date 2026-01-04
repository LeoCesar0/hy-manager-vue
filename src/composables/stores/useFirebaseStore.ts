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
import type { AppResponse } from "~/@schemas/app";
import type { AnyObject } from "~/@types/anyObject";

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
    firebaseApp = getApps()[0] as FirebaseApp;
  }

  const firebaseAuth = getAuth(firebaseApp);
  const firebaseDB = getFirestore(firebaseApp);
  const firebaseStorage = getStorage(firebaseApp);

  const wrappedFirebaseCreate = async <T extends AnyObject, R = T>(
    ...args: Parameters<typeof firebaseCreate<T, R>>
  ): Promise<AppResponse<R>> => {
    try {
      const response = await firebaseCreate<T, R>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseCreate -->`, error);
      return {
        data: null,
        error: {
          _isAppError: true,
          message: error.message || "An unexpected error occurred",
          _message: error.message || "",
        },
      };
    }
  };

  const wrappedFirebaseGet = async <T>(
    ...args: Parameters<typeof firebaseGet<T>>
  ): Promise<AppResponse<T>> => {
    try {
      const response = await firebaseGet<T>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseGet -->`, error);
      return {
        data: null,
        error: {
          _isAppError: true,
          message: error.message || "An unexpected error occurred",
          _message: error.message || "",
        },
      };
    }
  };

  const wrappedFirebaseUpdate = async <T>(
    ...args: Parameters<typeof firebaseUpdate<T>>
  ): Promise<AppResponse<T>> => {
    try {
      const response = await firebaseUpdate<T>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseUpdate -->`, error);
      return {
        data: null,
        error: {
          _isAppError: true,
          message: error.message || "An unexpected error occurred",
          _message: error.message || "",
        },
      };
    }
  };

  const wrappedFirebaseDelete = async (
    ...args: Parameters<typeof firebaseDelete>
  ): Promise<AppResponse<void>> => {
    try {
      const response = await firebaseDelete(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseDelete -->`, error);
      return {
        data: null,
        error: {
          _isAppError: true,
          message: error.message || "An unexpected error occurred",
          _message: error.message || "",
        },
      };
    }
  };

  const wrappedFirebaseList = async <T>(
    ...args: Parameters<typeof firebaseList<T>>
  ): Promise<AppResponse<T[]>> => {
    try {
      const response = await firebaseList<T>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseList -->`, error);
      return {
        data: null,
        error: {
          _isAppError: true,
          message: error.message || "An unexpected error occurred",
          _message: error.message || "",
        },
      };
    }
  };

  const wrappedFirebaseGetWhere = async <T>(
    ...args: Parameters<typeof firebaseGetWhere<T>>
  ): Promise<AppResponse<T | undefined>> => {
    try {
      const response = await firebaseGetWhere<T>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseGetWhere -->`, error);
      return {
        data: null,
        error: {
          _isAppError: true,
          message: error.message || "An unexpected error occurred",
          _message: error.message || "",
        },
      };
    }
  };

  const wrappedFirebasePaginatedList = async <T>(
    ...args: Parameters<typeof firebasePaginatedList<T>>
  ): Promise<
    AppResponse<Awaited<ReturnType<typeof firebasePaginatedList<T>>>>
  > => {
    try {
      const response = await firebasePaginatedList<T>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebasePaginatedList -->`, error);
      return {
        data: null,
        error: {
          _isAppError: true,
          message: error.message || "An unexpected error occurred",
          _message: error.message || "",
        },
      };
    }
  };

  return {
    // Auth
    firebaseAuth: firebaseAuth,

    // Firestore
    firebaseDB: firebaseDB,

    // Storage
    firebaseStorage: firebaseStorage,

    // CRUD operations
    firebaseCreate: wrappedFirebaseCreate,
    firebaseGet: wrappedFirebaseGet,
    firebaseUpdate: wrappedFirebaseUpdate,
    firebaseDelete: wrappedFirebaseDelete,
    firebaseList: wrappedFirebaseList,
    firebaseGetWhere: wrappedFirebaseGetWhere,
    firebasePaginatedList: wrappedFirebasePaginatedList,
  };
});
