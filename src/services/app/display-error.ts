import type { AppError, AppResponseError } from "~/@schemas/app";

export const FORCE_DISPLAY_ERROR_CAUSE = "APP_CUSTOM_ERROR";

export const DISPLAY_ERROR = ({ message }: { message: string }) => {
  throw new Error(message, {
    cause: FORCE_DISPLAY_ERROR_CAUSE,
  });
};
