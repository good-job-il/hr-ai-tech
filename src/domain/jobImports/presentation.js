const EMPTY_VALUE = "—"

export function formatImportDate(value, locale) {
  if (!value) {
    return EMPTY_VALUE
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export function formatImportNumber(value, locale) {
  if (value == null || value === "") {
    return EMPTY_VALUE
  }

  const number = Number(value)

  return Number.isFinite(number) ? new Intl.NumberFormat(locale).format(number) : EMPTY_VALUE
}

export function formatImportPercent(value, locale) {
  if (value == null || value === "") {
    return EMPTY_VALUE
  }

  const number = Number(value)

  return Number.isFinite(number)
    ? new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(number)
    : EMPTY_VALUE
}

export function formatImportCurrency(value, currency, locale) {
  if (value == null || value === "") {
    return EMPTY_VALUE
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return EMPTY_VALUE
  }

  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(number)
  } catch {
    return formatImportNumber(number, locale)
  }
}

export function formatImportRelativeTime(value, locale, now = Date.now()) {
  if (!value) {
    return EMPTY_VALUE
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return EMPTY_VALUE
  }

  const days = Math.round((date.getTime() - now) / 86_400_000)

  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(days, "day")
}

export function importErrorCode(error) {
  return error?.details?.code || error?.details?.error?.code || error?.code || null
}

export function localizedImportError(error, t, fallback) {
  const code = importErrorCode(error)

  return code && t(`jobImports.errors.${code}`, { defaultValue: "" })
    ? t(`jobImports.errors.${code}`)
    : fallback
}

export function localizedImportIssue(issue, t) {
  return t(`jobImports.issues.${issue?.code}`, {
    defaultValue: t("jobImports.issues.generic"),
  })
}
