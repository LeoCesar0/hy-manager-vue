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
import { handleAppRequest } from "~/services/api/@handlers/handle-app-request";

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
    return handleAppRequest(() => firebaseCreate<T, R>(...args), {
      defaultErrorMessage: "Failed to create item",
    });
  };

  const wrappedFirebaseCreateMany = async <T extends AnyObject, R = T>(
    ...args: Parameters<typeof firebaseCreateMany<T, R>>
  ): Promise<AppResponse<R[]>> => {
    return handleAppRequest(() => firebaseCreateMany<T, R>(...args), {
      defaultErrorMessage: "Failed to create items",
    });
  };

  const wrappedFirebaseGet = async <R>(
    ...args: Parameters<typeof firebaseGet<R>>
  ): Promise<AppResponse<R>> => {
    return handleAppRequest(() => firebaseGet<R>(...args), {
      defaultErrorMessage: "Failed to fetch item",
    });
  };

  const wrappedFirebaseUpdate = async <T extends AnyObject, R = T>(
    ...args: Parameters<typeof firebaseUpdate<T, R>>
  ): Promise<AppResponse<R>> => {
    return handleAppRequest(() => firebaseUpdate<T, R>(...args), {
      defaultErrorMessage: "Failed to update item",
    });
  };

  const wrappedFirebaseUpdateMany = async <T extends AnyObject, R = T>(
    ...args: Parameters<typeof firebaseUpdateMany<T, R>>
  ): Promise<AppResponse<{ id: string; data: R }[]>> => {
    return handleAppRequest(() => firebaseUpdateMany<T, R>(...args), {
      defaultErrorMessage: "Failed to update items",
    });
  };

  const wrappedFirebaseDelete = async (
    ...args: Parameters<typeof firebaseDelete>
  ): Promise<AppResponse<void>> => {
    return handleAppRequest(() => firebaseDelete(...args), {
      defaultErrorMessage: "Failed to delete item",
    });
  };

  const wrappedFirebaseList = async <R>(
    ...args: Parameters<typeof firebaseList<R>>
  ): Promise<AppResponse<R[]>> => {
    return handleAppRequest(() => firebaseList<R>(...args), {
      defaultErrorMessage: "Failed to fetch list",
    });
  };

  const wrappedFirebaseGetWhere = async <R>(
    ...args: Parameters<typeof firebaseGetWhere<R>>
  ): Promise<AppResponse<R | undefined>> => {
    return handleAppRequest(() => firebaseGetWhere<R>(...args), {
      defaultErrorMessage: "Failed to fetch item",
    });
  };

  const wrappedFirebasePaginatedList = async <R>(
    ...args: Parameters<typeof firebasePaginatedList<R>>
  ): Promise<
    AppResponse<Awaited<ReturnType<typeof firebasePaginatedList<R>>>>
  > => {
    return handleAppRequest(() => firebasePaginatedList<R>(...args), {
      defaultErrorMessage: "Failed to fetch paginated list",
    });
  };

  return {
    firebaseAuth: firebaseAuth,
    firebaseDB: firebaseDB,
    firebaseStorage: firebaseStorage,
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
