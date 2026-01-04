import { firebaseCreate } from "~/services/firebase/firebaseCreate";
import { firebaseCreateMany } from "~/services/firebase/firebaseCreateMany";
import { firebaseGet } from "~/services/firebase/firebaseGet";
import { firebaseUpdate } from "~/services/firebase/firebaseUpdate";
import { firebaseUpdateMany } from "~/services/firebase/firebaseUpdateMany";
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

  console.log(`❗ firebaseConfig -->`, firebaseConfig);

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

  const wrappedFirebaseCreateMany = async <T extends AnyObject, R = T>(
    ...args: Parameters<typeof firebaseCreateMany<T, R>>
  ): Promise<AppResponse<R[]>> => {
    try {
      const response = await firebaseCreateMany<T, R>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseCreateMany -->`, error);
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

  const wrappedFirebaseGet = async <R>(
    ...args: Parameters<typeof firebaseGet<R>>
  ): Promise<AppResponse<R>> => {
    try {
      const response = await firebaseGet<R>(...args);
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

  const wrappedFirebaseUpdate = async <T extends AnyObject, R = T>(
    ...args: Parameters<typeof firebaseUpdate<T, R>>
  ): Promise<AppResponse<R>> => {
    try {
      const response = await firebaseUpdate<T, R>(...args);
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

  const wrappedFirebaseUpdateMany = async <T extends AnyObject, R = T>(
    ...args: Parameters<typeof firebaseUpdateMany<T, R>>
  ): Promise<AppResponse<{ id: string; data: R }[]>> => {
    try {
      const response = await firebaseUpdateMany<T, R>(...args);
      return { data: response, error: null };
    } catch (error: any) {
      console.log(`❌ Error in firebaseUpdateMany -->`, error);
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

  const wrappedFirebaseList = async <R>(
    ...args: Parameters<typeof firebaseList<R>>
  ): Promise<AppResponse<R[]>> => {
    try {
      const response = await firebaseList<R>(...args);
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

  const wrappedFirebaseGetWhere = async <R>(
    ...args: Parameters<typeof firebaseGetWhere<R>>
  ): Promise<AppResponse<R | undefined>> => {
    try {
      const response = await firebaseGetWhere<R>(...args);
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

  const wrappedFirebasePaginatedList = async <R>(
    ...args: Parameters<typeof firebasePaginatedList<R>>
  ): Promise<
    AppResponse<Awaited<ReturnType<typeof firebasePaginatedList<R>>>>
  > => {
    try {
      const response = await firebasePaginatedList<R>(...args);
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
    modelCreate: wrappedFirebaseCreate,
    modelCreateMany: wrappedFirebaseCreateMany,
    modelGet: wrappedFirebaseGet,
    modelUpdate: wrappedFirebaseUpdate,
    modelUpdateMany: wrappedFirebaseUpdateMany,
    modelDelete: wrappedFirebaseDelete,
    modelList: wrappedFirebaseList,
    modelGetWhere: wrappedFirebaseGetWhere,
    modelPaginatedList: wrappedFirebasePaginatedList,
  };
});
