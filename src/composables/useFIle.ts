import { ref } from "vue";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import type { IFile, IFileBase } from "~/@schemas/models/file";
import { Timestamp } from "firebase/firestore";

type IGetFileByIdProps = {
  fileId: string;
  path: string;
};

type IUploadFileProps = {
  file: File;
  path: string;
  userId: string;
};

export const useFile = () => {
  const { firebaseStorage, create } = useFirebaseStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const { user } = useUserStore();

  const getFileRef = ({}: {
    user:IUser
  }) => {

  }

  const getFileById = async ({
    fileId,
    path,
  }: IGetFileByIdProps): Promise<string> => {
    try {
      loading.value = true;
      error.value = null;

      const fileRef = storageRef(firebaseStorage, `${path}/${fileId}`);
      const url = await getDownloadURL(fileRef);

      return url;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to get file";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadFile = async ({
    file,
    path,
    userId,
  }: IUploadFileProps): Promise<IFile> => {
    try {
      loading.value = true;
      error.value = null;

      const fileRef = storageRef(firebaseStorage, `${path}/${file.name}`);

      // Create file metadata
      const fileData: IFileBase = {
        name: file.name,
        size: file.size,
        type: file.type,
        user: userId,
        url: "", // Will be updated after upload
        path: `${path}/${file.name}`,
      };

      // Create document in Firestore
      await create({
        collection: "files",
        data: fileData,
      });

      // Get download URL
      const url = await getFileById({ fileId: file.name, path });

      // Update file document with URL
      await create({
        collection: "files",
        data: { ...fileData, url },
      });

      return { ...fileData, url };
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to upload file";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    getFileById,
    uploadFile,
  };
};
