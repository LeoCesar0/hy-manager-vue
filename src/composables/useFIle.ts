import { ref } from "vue";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import type { IFile, IFileBase } from "~/@schemas/models/file";
import { Timestamp } from "firebase/firestore";
import type { IUser } from "~/@schemas/models/user";
import { slugify } from "~/helpers/slugify";
import type { AppResponse } from "~/@schemas/app";
import { generateId } from "~/helpers/generateId";
import { handleApiError } from "~/handlers/handleApiError";

export type IGetFileByIdProps = {
  fileId: string;
  path: string;
};

export type IUploadFileProps = {
  file: File;
  path: string;
  userId: string;
};

export const useFile = () => {
  const { firebaseStorage, firebaseCreate, firebaseGet } = useFirebaseStore();
  const loading = ref(false);

  const store = useUserStore();
  const { currentUser } = storeToRefs(store);
  const { toast } = useToast();

  const makeFilePath = ({
    user,
    fileName,
    fileId,
  }: {
    user: IUser;
    fileName: string;
    fileId: string;
  }) => {
    if (!user.id) {
      throw new Error("Error creating file path: user id doesn't exist");
    }
    return `user-${user.id}/${slugify(fileName)}-${fileId}`;
  };
  const getStorageRef = ({ path }: { path: string }) => {
    return storageRef(firebaseStorage, path);
  };

  const getDownloadUrl = async ({
    path,
  }: IGetFileByIdProps): Promise<string> => {
    try {
      loading.value = true;

      const fileRef = getStorageRef({ path });
      const url = await getDownloadURL(fileRef);

      return url;
    } catch (err) {
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const getFileById = async ({
    fileId,
  }: IGetFileByIdProps): Promise<AppResponse<IFile>> => {
    try {
      loading.value = true;

      const file = await firebaseGet<IFile>({
        collection: "files",
        id: fileId,
      });

      const response: AppResponse<IFile> = {
        data: file,
        error: null,
      };
      loading.value = false;

      return response;
    } catch (err) {
      loading.value = false;
      const response = handleApiError({ err: err });
      const message = response.error.message;
      if (message) {
        toast.error(message);
      }
      return response;
    }
  };

  const uploadFile = async ({
    file,
  }: IUploadFileProps): Promise<AppResponse<IFile>> => {
    try {
      loading.value = true;
      if (!currentUser.value) {
        throw new Error("User not found");
      }
      const fileId = generateId();

      const userId = currentUser.value.id;

      const filePath = makeFilePath({
        user: currentUser.value,
        fileName: file.name,
        fileId: fileId,
      });

      const fileRef = getStorageRef({ path: filePath });

      // Create file metadata
      const fileData: IFileBase = {
        name: file.name,
        size: file.size,
        type: file.type,
        user: userId,
        url: "", // Will be updated after upload
        path: filePath,
      };
      const url = await getDownloadUrl({ fileId: file.name, path: filePath });
      fileData.url = url;

      // Create document in Firestore
      const createdFile = await firebaseCreate<IFile>({
        collection: "files",
        data: fileData,
      });

      const response: AppResponse<IFile> = {
        data: createdFile,
        error: null,
      };
      loading.value = false;
      return response;
    } catch (err) {
      loading.value = false;
      const response = handleApiError({ err: err });
      const message = response.error.message;
      if (message) {
        toast.error(message);
      }
      return response;
    }
  };

  const uploadFiles = async (files: File[]): Promise<AppResponse<IFile[]>> => {
    try {
      loading.value = true;
      if (!currentUser.value) {
        throw new Error("User not found");
      }

      const uploadPromises = files.map(async (file) => {
        const fileId = generateId();
        const userId = currentUser.value!.id;

        const filePath = makeFilePath({
          user: currentUser.value!,
          fileName: file.name,
          fileId: fileId,
        });

        const fileRef = getStorageRef({ path: filePath });

        const fileData: IFileBase = {
          name: file.name,
          size: file.size,
          type: file.type,
          user: userId,
          url: "",
          path: filePath,
        };

        const url = await getDownloadUrl({ fileId: file.name, path: filePath });
        fileData.url = url;

        const createdFile = await firebaseCreate<IFile>({
          collection: "files",
          data: fileData,
        });

        return createdFile;
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      const response: AppResponse<IFile[]> = {
        data: uploadedFiles,
        error: null,
      };
      loading.value = false;
      return response;
    } catch (err) {
      loading.value = false;
      const response = handleApiError({ err: err });
      const message = response.error.message;
      if (message) {
        toast.error(message);
      }
      return response as AppResponse<IFile[]>;
    }
  };

  const listFiles = async (
    fileIds: string[]
  ): Promise<AppResponse<IFile[]>> => {
    try {
      loading.value = true;

      const filePromises = fileIds.map(async (fileId) => {
        return await firebaseGet<IFile>({
          collection: "files",
          id: fileId,
        });
      });

      const files = await Promise.all(filePromises);

      const response: AppResponse<IFile[]> = {
        data: files,
        error: null,
      };
      loading.value = false;
      return response;
    } catch (err) {
      loading.value = false;
      const response = handleApiError({ err: err });
      const message = response.error.message;
      if (message) {
        toast.error(message);
      }
      return response as AppResponse<IFile[]>;
    }
  };

  return {
    loading,
    getFileById: getDownloadUrl,
    uploadFile,
    uploadFiles,
    listFiles,
  };
};
