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
      message: `Buscando ${itemName.toLowerCase()}...`,
    } : false,
    success: success ? {
      message: `${beautifyObjectName(itemName)} buscada com sucesso!`,
    } : false,
    error: {
      message: `Falha ao buscar ${itemName.toLowerCase()}`,
    },
  };
};
