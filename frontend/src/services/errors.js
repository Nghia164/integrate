// =============================================================================
// File: src/services/errors.js
// Định nghĩa các mã lỗi chuẩn và lớp AppError dùng chung
// =============================================================================

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  FORBIDDEN: "FORBIDDEN",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_STATE: "INVALID_STATE",
  CONFLICT: "CONFLICT",
  DEADLINE_EXCEEDED: "DEADLINE_EXCEEDED",
};

export class AppError extends Error {
  constructor(code, message, status = 400, details = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export default {
  ERROR_CODES,
  AppError,
};
