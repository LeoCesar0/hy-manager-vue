import { isApiError } from "~/helpers/isApiError";
import { handleUnexpectedError } from "./handleUnexpectedError";
import type { AppResponseError } from "~/@schemas/app";

export const handleApiError = ({ err }: { err: any }): AppResponseError => {
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
  // console.error("❗ handleApi Error -->", err);

  const isAPiError = isApiError(err);

  if (!isAPiError) {
    console.log("❗❗ Unexpected error in handleApiError");
    return handleUnexpectedError({ error: err });
  }

  let resError: AppResponseError = { ...err };

  return resError;
};
