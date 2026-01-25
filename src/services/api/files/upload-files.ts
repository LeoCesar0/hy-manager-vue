import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IFile, ICreateFile } from "~/@schemas/models/file";
import type { IAPIRequestCommon } from "../@types";
import { createFile } from "./create-file";
import { generateId } from "~/helpers/generateId";
import { slugify } from "~/helpers/slugify";
import { getDefaultCreateToastOptions } from "~/helpers/toast/get-default-create-toast-options";

type Item = IFile;

export type IAPIUploadFile = {
  file: File;
  userId: string;
} & IAPIRequestCommon<Item>;

export type IAPIUploadFiles = {
  files: File[];
  userId: string;
} & IAPIRequestCommon<Item[]>;

const makeFilePath = ({
  userId,
  fileName,
  fileId,
}: {
  userId: string;
  fileName: string;
  fileId: string;
}) => {
  return `user-${userId}/${slugify(fileName)}-${fileId}`;
};

const getFirebaseStorage = () => {
  const firebaseStore = useFirebaseStore();
  return firebaseStore.firebaseStorage;
};

const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  const storage = getFirebaseStorage();
  const fileRef = storageRef(storage, path);
  
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  
  return downloadURL;
};

export const uploadFile = async ({ file, userId, options }: IAPIUploadFile) => {
  const response = await handleAppRequest(
    async () => {
      const fileId = generateId();
      const filePath = makeFilePath({
        userId,
        fileName: file.name,
        fileId,
      });

      const url = await uploadFileToStorage(file, filePath);

      const fileData: ICreateFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        userId,
        url,
        path: filePath,
      };

      const result = await createFile({
        data: fileData,
        options: {
          toastOptions: undefined,
        },
      });

      if (!result.data) {
        throw new Error("Failed to create file record");
      }

      return result.data;
    },
    {
      toastOptions: {
        loading: {
          message: "Enviando arquivo...",
        },
        success: {
          message: "Arquivo enviado com sucesso!",
        },
        error: true,
      },
      ...options,
    }
  );
  return response;
};

export const uploadFiles = async ({ files, userId, options }: IAPIUploadFiles) => {
  const response = await handleAppRequest(
    async () => {
      const uploadPromises = files.map(async (file) => {
        const fileId = generateId();
        const filePath = makeFilePath({
          userId,
          fileName: file.name,
          fileId,
        });

        const url = await uploadFileToStorage(file, filePath);

        const fileData: ICreateFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          userId,
          url,
          path: filePath,
        };

        const result = await createFile({
          data: fileData,
          options: {
            toastOptions: undefined,
          },
        });

        return result.data;
      });

      const uploadedFiles = (await Promise.all(uploadPromises)).filter(
        Boolean
      ) as IFile[];

      return uploadedFiles;
    },
    {
      toastOptions: {
        loading: {
          message: `Enviando ${files.length} arquivo${files.length > 1 ? 's' : ''}...`,
        },
        success: {
          message: `${files.length} arquivo${files.length > 1 ? 's enviados' : ' enviado'} com sucesso!`,
        },
        error: true,
      },
      ...options,
    }
  );
  return response;
};
