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
      message: `Criando ${itemName.toLowerCase()}...`,
    },
    success: {
      message: `${beautifyObjectName(itemName)} criado com sucesso!`,
    },
    error: {
      message: `Falha ao criar ${itemName.toLowerCase()}`,
    },
  };
};
