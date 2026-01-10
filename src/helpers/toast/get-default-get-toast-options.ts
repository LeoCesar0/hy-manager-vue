import type { ToastOptions } from "~/@types/toast";
import { beautifyObjectName } from "../shadcnui-utils/auto-form";

type IProps = {
  itemName: string;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
};

export const getDefaultGetToastOptions = ({
  itemName,
  error,
  loading,
  success,
}: IProps): ToastOptions => {
  return {
    loading: loading ? {
      message: `Getting ${itemName.toLowerCase()}...`,
    } : false,
    success: success ? {
      message: `${beautifyObjectName(itemName)} got successfully!`,
    } : false,
    error: {
      message: `Failed to get ${itemName.toLowerCase()}`,
    },
  };
};
