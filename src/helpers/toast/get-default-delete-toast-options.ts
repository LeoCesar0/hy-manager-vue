import type { ToastOptions } from "~/@types/toast";
import { beautifyObjectName } from "../shadcnui-utils/auto-form";

type IProps = {
  itemName: string;
};

export const getDefaultDeleteToastOptions = ({
  itemName,
}: IProps): ToastOptions => {
  return {
    loading: {
      message: `Deletando ${itemName.toLowerCase()}...`,
    },
    success: {
      message: `${beautifyObjectName(itemName)} deletado com sucesso!`,
    },
    error: {
      message: `Falha ao deletar ${itemName.toLowerCase()}`,
    },
  };
};
