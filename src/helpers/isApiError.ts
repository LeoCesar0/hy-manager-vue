import type { AppResponseError } from "~/@schemas/app";

export const isApiError = (err: any): err is AppResponseError => {
  const test = err as AppResponseError;
  return !!test?.error?._isAppError;
};
