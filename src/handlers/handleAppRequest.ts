import type { AppResponse, AppResponseError } from "~/@schemas/app";
import type { ToastOptions } from "~/@types/toast";
import { handleApiError } from "./handleApiError";
import type { Id as LoadingId } from "vue3-toastify";

export type IHandleAppRequestProps<T> = {
  toastOptions?: ToastOptions;
  loadingRefs?: Ref<boolean>[];
  onSuccess?: (data: AppResponse<T>) => Promise<any>;
  onError?: (data: AppResponseError) => Promise<any>;
};

export const handleAppRequest = async <T>(
  request: () => Promise<T>,
  { loadingRefs, onSuccess, onError, toastOptions }: IHandleAppRequestProps<T>
) => {
  const { toast } = useToast();

  let toastLoadingId: null | LoadingId = null;

  const handleError = async (err: AppResponseError) => {
    if (onError) {
      await onError(err);
      await nextTick();
    }
    const errMessage =
      typeof toastOptions?.error === "object"
        ? toastOptions.error.message
        : err.error.message;
    if (toastLoadingId) {
      toast.update(toastLoadingId, {
        render: errMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
    if (!toastLoadingId && toastOptions?.error) {
      toast.error(errMessage);
    }
  };

  try {
    loadingRefs?.forEach((loadingRef) => {
      loadingRef.value = true;
    });

    if (toastOptions?.loading) {
      const loadingMes =
        typeof toastOptions.loading === "boolean"
          ? "Loading..."
          : toastOptions.loading.message;
      toastLoadingId = toast.loading(loadingMes);
    }
    const response = await request();
    loadingRefs?.forEach((loadingRef) => {
      loadingRef.value = false;
    });
    return response;
  } catch (err) {
    loadingRefs?.forEach((loadingRef) => {
      loadingRef.value = false;
    });
    const response = handleApiError({ err: err });
    handleError(response);
    return response;
  }
};
