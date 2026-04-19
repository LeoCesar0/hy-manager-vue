import { handleAppRequest } from "../@handlers/handle-app-request";
import type { IAPIRequestCommon } from "../@types";
import { clearBankAccountTransactions } from "../sync/clear-bank-account-transactions";

export type IAPIClearTransactions = {
  bankAccountId: string;
  userId: string;
} & IAPIRequestCommon<void>;

export const clearTransactions = async ({
  bankAccountId,
  userId,
  options,
}: IAPIClearTransactions) => {
  const response = await handleAppRequest(
    async () => {
      await clearBankAccountTransactions({ bankAccountId, userId });
    },
    {
      toastOptions: {
        loading: { message: "Limpando transações..." },
        success: { message: "Transações limpas com sucesso!" },
        error: { message: "Falha ao limpar transações" },
      },
      ...options,
    }
  );
  return response;
};
