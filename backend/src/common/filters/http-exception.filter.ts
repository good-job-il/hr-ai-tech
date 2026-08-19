import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { Request, Response } from "express"
import { ZodValidationException } from "nestjs-zod"

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = "Internal server error"
    let errors: any = undefined
    let code = "INTERNAL_ERROR"

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY
      message = "Validation failed"
      code = "VALIDATION_ERROR"
      const zodError = exception.getZodError() as unknown as {
        issues?: Array<{ path: PropertyKey[]; message: string; code: string }>
        errors?: Array<{ path: PropertyKey[]; message: string; code: string }>
      }
      errors = (zodError.issues ?? zodError.errors ?? []).map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }))
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === "string") {
        message = res
      } else if (typeof res === "object" && res !== null) {
        message = (res as any).message || message
        errors = (res as any).errors
        code = (res as any).code || `HTTP_${status}`
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack)
      message = exception.message
    }

    const body: Record<string, any> = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    if (errors) {
      body.errors = errors
    }

    const event = JSON.stringify({
      event: "http_error",
      request_id: request.requestId,
      method: request.method,
      path: request.path,
      status,
      code,
    })
    if (status >= 500) this.logger.error(event)
    else this.logger.warn(event)

    response.status(status).json(body)
  }
}
