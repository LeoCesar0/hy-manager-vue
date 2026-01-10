import type { AppResponse } from "~/@schemas/app";
import { handleUnexpectedError } from "~/services/api/@handlers/handle-unexpected-error";

export type ToastPromiseOptions<T> = {
  promise: Promise<AppResponse<T>>;
  loadingMessage?: string;
  successMessage?: string;
  defaultErrorMessage?: string;
  loadingRef?: Ref<boolean>;
};
export type ToastPromiseAnyOptions<T> = {
  promise: Promise<T>;
  loadingMessage?: string;
  successMessage?: string;
  defaultErrorMessage?: string;
  loadingRef?: Ref<boolean>;
};

export const useToast = () => {
  const nuxtApp = useNuxtApp();
  const toast = nuxtApp.$toast;

  const handleToastPromise = async <T extends any>({
    promise,
    loadingMessage = "Loading",
    defaultErrorMessage,
    successMessage = "Success",
    loadingRef,
  }: ToastPromiseOptions<T>): Promise<AppResponse<T>> => {
    const toastId = toast.loading(loadingMessage);
    if (loadingRef) {
      loadingRef.value = true;
    }

    return promise
      .then((results) => {
        if (results.data) {
          toast.update(toastId, {
            render: successMessage,
            type: "success",
            isLoading: false,
            autoClose: 5000,
          });
        } else {
          toast.update(toastId, {
            render: results?.error?.message || defaultErrorMessage,
            type: "error",
            isLoading: false,
            autoClose: 8000,
          });
        }
        return results;
      })
      .catch((err) => {
        console.log("❗ handleToastPromise catch -->", err);
        const error = handleUnexpectedError({
          error: err,
          errorMessage: defaultErrorMessage,
        });

        toast.update(toastId, {
          render: error.error.message,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        return error;
      })
      .finally(() => {
        if (loadingRef) {
          loadingRef.value = false;
        }
      });
  };

  const handleToastAnyPromise = async <T extends any>({
    promise,
    loadingMessage = "Loading",
    defaultErrorMessage,
    successMessage = "Success",
    loadingRef,
  }: ToastPromiseAnyOptions<T>): Promise<AppResponse<T>> => {
    const toastId = toast.loading(loadingMessage);
    if (loadingRef) {
      loadingRef.value = true;
    }
    return promise
      .then((results: any) => {
        let res: AppResponse<T>;
        if (results?.error) {
          const errorRes = handleUnexpectedError({
            error: results?.error,
            errorMessage: defaultErrorMessage,
          });
          toast.update(toastId, {
            render: errorRes.error.message,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });

          return errorRes;
        }
        toast.update(toastId, {
          render: successMessage,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
        res = {
          data: results,
          error: null,
        };
        return res;
      })
      .catch((err) => {
        console.log("❗ handleToastAnyPromise catch -->", err);
        const errorRes = handleUnexpectedError({
          error: err,
          errorMessage: defaultErrorMessage,
        });
        toast.update(toastId, {
          render: errorRes.error?.message,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        return errorRes;
      })
      .finally(() => {
        if (loadingRef) {
          loadingRef.value = false;
        }
      });
  };

  return {
    handleToastPromise,
    handleToastAnyPromise,
    toast,
  };
};
