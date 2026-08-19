import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

export interface TransformedResponse<T> {
  data: T
  status: number
  timestamp: string
}

/**
 * Wraps every successful response in:
 *   { data: ..., status: 200, timestamp: "..." }
 *
 * Responses that are already in paginated format:
 *   { data: [...], pagination: {...} }
 * are passed through as-is (no double wrapping).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<TransformedResponse<T>> {
    const httpContext = context.switchToHttp()

    const response = httpContext.getResponse()

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode ?? 200

        // Already a paginated response — just add status + timestamp
        if (data && typeof data === "object" && "pagination" in data && "data" in data) {
          return {
            ...data,
            status: statusCode,
            timestamp: new Date().toISOString(),
          }
        }

        return {
          data,
          status: statusCode,
          timestamp: new Date().toISOString(),
        }
      }),
    )
  }
}
