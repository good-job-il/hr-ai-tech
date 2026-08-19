export interface PaginationOptions {
  page?: number
  limit?: number
  sort?: string
  order?: "ASC" | "DESC"
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

/**
 * Parse pagination query params from request.
 * Defaults: page=1, limit=20, order=DESC
 */
export function parsePagination(query: Record<string, any>): PaginationOptions {
  const page = Math.max(1, parseInt(query.page, 10) || 1)

  const limit = Math.min(500, Math.max(1, parseInt(query.limit, 10) || 20))

  const sort = query.sort || "created_date"

  const order = (query.order?.toUpperCase() as "ASC" | "DESC") === "ASC" ? "ASC" : "DESC"

  return { page, limit, sort, order }
}

/**
 * Build paginated response envelope compatible with frontend's PaginatedResponse<T>.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  const page = options.page ?? 1

  const limit = options.limit ?? 20

  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }
}

/**
 * Calculate TypeORM skip/take from page/limit.
 */
export function getSkipTake(page: number, limit: number): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: limit,
  }
}
