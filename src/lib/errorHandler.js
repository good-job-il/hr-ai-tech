// Error handling and logging utility
export class AppError extends Error {
  constructor(message, code = "UNKNOWN_ERROR", context = {}) {
    super(message)
    this.code = code
    this.context = context
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
    }
  }
}

export const ErrorTypes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT: "TIMEOUT",
  IMPORT_ERROR: "IMPORT_ERROR",
}

export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message
  }
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  if (error?.message) {
    return error.message
  }
  return "אירעה שגיאה. אנא נסה שוב."
}

export const logError = (error, source = "unknown") => {
  const errorData = {
    source,
    timestamp: new Date().toISOString(),
    message: error?.message || "Unknown error",
    code: error?.code || "UNKNOWN",
    context: error?.context || {},
    stack: error?.stack,
  }

  console.error("[ERROR]", JSON.stringify(errorData, null, 2))

  // Could send to monitoring service here
  return errorData
}
