import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import {
  formatImportCurrency,
  formatImportDate,
  formatImportNumber,
  formatImportPercent,
  formatImportRelativeTime,
  localizedImportError,
  localizedImportIssue,
} from "./presentation.js"

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")

const en = JSON.parse(read("locales/en/translation.json"))

const he = JSON.parse(read("locales/he/translation.json"))

const keys = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key

    return child && typeof child === "object" ? keys(child, path) : [path]
  })

const translator =
  (locale) =>
  (key, { defaultValue } = {}) => {
    const value = key.split(".").reduce((entry, segment) => entry?.[segment], locale)

    return typeof value === "string" ? value : (defaultValue ?? key)
  }

test("EN and HE contain the same non-empty import workflow strings", () => {
  assert.deepEqual(keys(en.jobImports).sort(), keys(he.jobImports).sort())

  for (const locale of [en, he]) {
    for (const key of keys(locale.jobImports)) {
      const value = key.split(".").reduce((entry, segment) => entry?.[segment], locale.jobImports)

      assert.ok(value.trim(), key)
    }
  }
})

test("typed import errors and validation issues are localized without leaking English backend prose", () => {
  const t = translator(he)

  assert.equal(
    localizedImportError(
      { details: { code: "RATE_LIMITED" }, message: "Retry later" },
      t,
      "fallback",
    ),
    he.jobImports.errors.RATE_LIMITED,
  )
  assert.equal(
    localizedImportIssue({ code: "INVALID_JOB_TITLE", message: "Bad title" }, t),
    he.jobImports.issues.INVALID_JOB_TITLE,
  )
  assert.equal(
    localizedImportError({ message: "English server error" }, t, he.jobImports.wizard.genericError),
    he.jobImports.wizard.genericError,
  )
})

test("numbers, dates, percentages, salary and relative time follow the active locale", () => {
  for (const locale of ["en", "he"]) {
    assert.equal(formatImportNumber(1234567, locale), new Intl.NumberFormat(locale).format(1234567))
    assert.equal(
      formatImportPercent(0.87, locale),
      new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(0.87),
    )
    assert.equal(
      formatImportCurrency(15000, "ILS", locale),
      new Intl.NumberFormat(locale, { style: "currency", currency: "ILS" }).format(15000),
    )
    assert.equal(
      formatImportDate("2026-10-01T10:00:00.000Z", locale),
      new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date("2026-10-01T10:00:00.000Z"),
      ),
    )
    assert.equal(
      formatImportRelativeTime("2026-10-03", locale, Date.parse("2026-10-01")),
      new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(2, "day"),
    )
  }

  assert.equal(formatImportCurrency(null, "ILS", "he"), "—")
  assert.equal(formatImportDate("not a date", "he"), "—")
  assert.equal(formatImportRelativeTime(null, "he"), "—")
})

test("import workflow exposes semantic keyboard and responsive affordances", () => {
  const ui = read("pages/jobImports/JobImportUi.jsx")

  const wizard = read("pages/jobImports/JobImportNewPage.jsx")

  const review = read("pages/jobImports/JobImportRunReviewPage.jsx")

  const sources = read("pages/jobImports/JobImportSourcesPage.jsx")

  const css = read("index.css")

  assert.match(ui, /dir=\{i18n\.dir\(\)\}/)
  assert.match(wizard, /<AlertDialog open=\{archivePrompt\}/)
  assert.match(wizard, /<pre\s+dir="ltr"/)
  assert.match(wizard, /role="status"\s+aria-live="polite"/)
  assert.match(review, /aria-expanded=\{open\}/)
  assert.match(review, /aria-controls=\{`job-import-review-/)
  assert.match(review, /selectPage/)
  assert.match(review, /aria-label=\{t\("jobImports\.review\.actions\.approve"\)\}/)
  assert.match(review, /role="status"\s+aria-live="polite"/)
  assert.doesNotMatch(review, /min-w-\[760px\]/)
  assert.doesNotMatch(review, /minmax\(310px,auto\)/)
  assert.match(review, /sm:col-span-3 sm:grid-cols-\[minmax\(0,1fr\)/)
  assert.doesNotMatch(wizard, /<table/)
  assert.match(sources, /jobImports\.sources\.search/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.match(css, /\[role="dialog"\]/)
  assert.match(wizard, /jobImports\.statuses\.\$\{action\}/)

  for (const action of ["create", "update", "close", "reopen", "skip", "review"]) {
    assert.ok(en.jobImports.statuses[action])
    assert.ok(he.jobImports.statuses[action])
  }

  assert.match(css, /focus-visible/)
})
