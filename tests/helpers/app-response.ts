import type { AppResponse, AppResponseError, AppError } from "~/@schemas/app";

/**
 * Creates a successful AppResponse.
 */
export const makeSuccessResponse = <T>(data: T): AppResponse<T> => ({
  data,
  error: null,
});

/**
 * Creates an error AppResponse.
 */
export const makeErrorResponse = (
  message: string,
  overrides?: Partial<AppError>
): AppResponseError => ({
  data: null,
  error: {
    _isAppError: true,
    message,
    ...overrides,
  },
});
