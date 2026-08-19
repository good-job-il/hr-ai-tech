// Barrel export for error infrastructure

export { AppError, ErrorCode } from "./AppError"
export type { ErrorContext } from "./AppError"

export { ErrorNormalizer } from "./errorNormalizer"
export type { NormalizedError } from "./errorNormalizer"

export { useErrorHandler } from "./useErrorHandler"
export type { ErrorHandlerOptions } from "./useErrorHandler"
