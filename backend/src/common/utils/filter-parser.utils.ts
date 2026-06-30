/**
 * Parse filter[key]=value query params into a plain object.
 *
 * The frontend's BaseRepository sends filters as:
 *   filter[organization_id]=abc&filter[status]=active
 *
 * This utility converts that to: { organization_id: 'abc', status: 'active' }
 *
 * Also handles dot-notation: filter[meta.field]=value → { 'meta.field': value }
 */
export function parseFilters(query: Record<string, any>): Record<string, any> {
  const filters: Record<string, any> = {};

  for (const key of Object.keys(query)) {
    // Match filter[someKey] pattern
    const match = key.match(/^filter\[(.+)\]$/);
    if (match) {
      const fieldName = match[1];
      const rawValue = query[key];
      filters[fieldName] = castFilterValue(rawValue);
    }
  }

  return filters;
}

/**
 * Cast string query param values to appropriate types.
 */
function castFilterValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === '') return undefined;

  // Numeric check
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;

  return value;
}

/**
 * Build a TypeORM-compatible WHERE clause from parsed filters.
 * Supports simple equality filters only (extend for advanced ops).
 */
export function buildWhereClause(
  filters: Record<string, any>,
  allowedFields: string[] = [],
): Record<string, any> {
  const where: Record<string, any> = {};

  for (const [key, value] of Object.entries(filters)) {
    // If allowedFields is specified, only include those
    if (allowedFields.length > 0 && !allowedFields.includes(key)) {
      continue;
    }
    if (value !== undefined && value !== null) {
      where[key] = value;
    }
  }

  return where;
}

