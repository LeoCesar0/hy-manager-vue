import { FirebaseError } from "firebase/app";
import type { AppResponseError } from "~/@schemas/app";
import { EXCEPTION_FIREBASE_CODE } from "~/static/exceptions";

export const handleUnexpectedError = ({
  error,
  errorMessage,
}: {
  error: any;
  errorMessage?: string;
}): AppResponseError => {
  let resData: AppResponseError;

  if (error instanceof FirebaseError) {
    error.code === EXCEPTION_FIREBASE_CODE.INVALID_CREDENTIALS;
    resData = {
      data: null,
      error: {
        _isAppError: true,
        message: "Invalid email or password",
      },
    };
    return resData;
  }

  resData = {
    data: null,
    error: {
      _isAppError: true,
      message: errorMessage ?? "Unexpected error",
    },
  };

  return resData;
};
