import type { ToastOptions } from "~/@types/toast";
import { beautifyObjectName } from "../shadcnui-utils/auto-form";

type IProps = {
  itemName: string;
};

export const getDefaultCreateToastOptions = ({
  itemName,
}: IProps): ToastOptions => {
  return {
    loading: {
      message: `Creating ${itemName.toLowerCase()}...`,
    },
    success: {
      message: `${beautifyObjectName(itemName)} created successfully!`,
    },
    error: {
      message: `Failed to create ${itemName.toLowerCase()}`,
    },
  };
};
