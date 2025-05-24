export const EXCEPTION_CODE = {
  NOT_AUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const EXCEPTION_FIREBASE_CODE = {
  EXPIRED_TOKEN: "auth/id-token-expired",
  INVALID_CREDENTIALS: "auth/invalid-credential",
} as const;
