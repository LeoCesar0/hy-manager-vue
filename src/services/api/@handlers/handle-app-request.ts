import type { AppResponse, AppResponseError } from "~/@schemas/app";
import type { ToastOptions } from "~/@types/toast";
import { handleApiError } from "./handle-api-errors";
import type { Id as LoadingId } from "vue3-toastify";
import { FORCE_DISPLAY_ERROR_CAUSE } from "~/services/app/display-error";

export type IHandleAppRequestProps<T> = {
  toastOptions?: ToastOptions;
  loadingRefs?: Ref<boolean>[];
  onSuccess?: (data: T) => Promise<any> | void;
  onError?: (error: AppResponseError) => Promise<any> | void;
  defaultErrorMessage?: string;
};

export const handleAppRequest = async <T>(
  request: () => Promise<AppResponse<T>> | Promise<T>,
  {
    loadingRefs,
    onSuccess,
    onError,
    toastOptions,
    defaultErrorMessage,
  }: IHandleAppRequestProps<T> = {}
): Promise<AppResponse<T>> => {
  const { toast } = useToast();

  let toastLoadingId: null | LoadingId = null;

  const handleError = async (res: AppResponseError) => {
    if (onError) {
      await onError(res);
      await nextTick();
    }
    let errMessage =
      typeof toastOptions?.error === "object"
        ? toastOptions.error.message
        : res.error.message;

    if (res.error.code === FORCE_DISPLAY_ERROR_CAUSE) {
      errMessage = res.error.message;
    }

    if (toastLoadingId) {
      toast.update(toastLoadingId, {
        render: errMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } else if (toastOptions?.error) {
      toast.error(errMessage);
    }
  };

  const handleSuccess = async (data: T) => {
    if (onSuccess) {
      await onSuccess(data);
      await nextTick();
    }

    const successMessage =
      typeof toastOptions?.success === "object"
        ? toastOptions.success.message
        : "Success";

    if (toastLoadingId && toastOptions?.success) {
      toast.update(toastLoadingId, {
        render: successMessage,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } else if (toastOptions?.success) {
      toast.success(successMessage);
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

    let normalizedResponse: AppResponse<T>;

    if (
      response &&
      typeof response === "object" &&
      "error" in response &&
      "data" in response
    ) {
      normalizedResponse = response as AppResponse<T>;
    } else {
      normalizedResponse = {
        data: response as T,
        error: null,
      };
    }

    loadingRefs?.forEach((loadingRef) => {
      loadingRef.value = false;
    });

    if (normalizedResponse.error) {
      await handleError(normalizedResponse as AppResponseError);
      return normalizedResponse;
    }

    await handleSuccess(normalizedResponse.data);

    if (toastLoadingId && !toastOptions?.success) {
      toast.remove(toastLoadingId);
    }

    return normalizedResponse;
  } catch (err) {
    loadingRefs?.forEach((loadingRef) => {
      loadingRef.value = false;
    });
    const errorResponse = handleApiError({ err, defaultErrorMessage });
    await handleError(errorResponse);
    return errorResponse;
  }
};
