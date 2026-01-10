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
    let message = errorMessage ?? "An error occurred";
    let code = error.code;

    switch (error.code) {
      case EXCEPTION_FIREBASE_CODE.INVALID_CREDENTIALS:
        message = "Invalid email or password";
        break;
      case EXCEPTION_FIREBASE_CODE.EXPIRED_TOKEN:
        message = "Your session has expired. Please sign in again";
        break;
      case "auth/user-not-found":
        message = "User not found";
        break;
      case "auth/wrong-password":
        message = "Incorrect password";
        break;
      case "auth/email-already-in-use":
        message = "Email is already in use";
        break;
      case "auth/weak-password":
        message = "Password is too weak";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your connection";
        break;
      case "auth/too-many-requests":
        message = "Too many attempts. Please try again later";
        break;
      case "permission-denied":
        message = "Permission denied. You don't have access to this resource";
        break;
      case "not-found":
        message = "Resource not found";
        break;
      case "already-exists":
        message = "Resource already exists";
        break;
      case "failed-precondition":
        message = "Operation failed. Please try again";
        break;
      case "unavailable":
        message = "Service temporarily unavailable. Please try again";
        break;
      default:
        if (errorMessage) {
          message = errorMessage;
        } else if (error.message) {
          message = error.message;
        }
    }

    resData = {
      data: null,
      error: {
        _isAppError: true,
        message,
        code,
        _message: error.message,
      },
    };
    return resData;
  }

  resData = {
    data: null,
    error: {
      _isAppError: true,
      message: errorMessage ?? error?.message ?? "Unexpected error",
      _message: error?.message,
      _data: error,
    },
  };

  return resData;
};
