import { isApiError } from "~/helpers/isApiError";
import { handleUnexpectedError } from "./handle-unexpected-error";
import type { AppResponseError } from "~/@schemas/app";

export const handleApiError = ({
  err,
  defaultErrorMessage,
}: {
  err: any;
  defaultErrorMessage?: string;
}): AppResponseError => {
  if (err?.response && err?.response._data) {
    err = err.response._data;
  }
  if (err?._data) {
    err = err._data;
  } else {
    if (err?.data) {
      err = err.data;
    }
  }

  const isAPiError = isApiError(err);

  if (!isAPiError) {
    return handleUnexpectedError({
      error: err,
      errorMessage: defaultErrorMessage,
    });
  }

  let resError: AppResponseError = { ...err };

  return resError;
};
