import type { ToastOptions } from "~/@types/toast";
import { beautifyObjectName } from "../shadcnui-utils/auto-form";

type IProps = {
  itemName: string;
};

export const getDefaultUpdateToastOptions = ({
  itemName,
}: IProps): ToastOptions => {
  return {
    loading: {
      message: `Updating ${itemName.toLowerCase()}...`,
    },
    success: {
      message: `${beautifyObjectName(itemName)} updated successfully!`,
    },
    error: {
      message: `Failed to update ${itemName.toLowerCase()}`,
    },
  };
};
