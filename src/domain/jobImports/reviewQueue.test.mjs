import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const page = readFileSync(
  new URL("../../pages/jobImports/JobImportRunReviewPage.jsx", import.meta.url),
  "utf8",
)

const api = readFileSync(
  new URL("../../api/services/importSourceService.ts", import.meta.url),
  "utf8",
)

const routes = readFileSync(new URL("../../App.jsx", import.meta.url), "utf8")

const en = JSON.parse(
  readFileSync(new URL("../../locales/en/translation.json", import.meta.url), "utf8"),
)

const he = JSON.parse(
  readFileSync(new URL("../../locales/he/translation.json", import.meta.url), "utf8"),
)

test("review queue is routed and delegates all decisions to typed server endpoints", () => {
  assert.match(routes, /agency\/import\/jobs\/review/)

  for (const endpoint of [
    "/job-imports/review-items",
    "/approve",
    "/reject",
    "/retry",
    "/correct",
    "/link-duplicate",
    "/items/resolve",
  ]) {
    assert.match(api, new RegExp(endpoint.replaceAll("/", "\\/")))
  }
})

test("review queue keeps operational state in URL and exposes server-side filters", () => {
  for (const marker of [
    "useSearchParams",
    "source_id",
    "employer_company_id",
    "issue_code",
    "min_confidence",
    "max_confidence",
    'searchParams.get("selected")',
    'param("page")',
  ]) {
    assert.match(page, new RegExp(marker.replace(/[()]/g, "\\$&")))
  }
})

test("review decisions expose source/current comparison and required safety controls", () => {
  for (const marker of [
    "sourcePayload",
    "normalized",
    "currentJob",
    "fieldDiff",
    "CorrectionForm",
    "confirm_bulk_close",
    "probable_duplicates",
    "item.stale",
  ]) {
    assert.match(page.toLowerCase(), new RegExp(marker.toLowerCase()))
  }

  assert.match(page, /AlertDialog/)
  assert.match(page, /linkDuplicate/)
})

test("review queue has complete English and Hebrew localization", () => {
  for (const locale of [en, he]) {
    assert.equal(typeof locale.jobImports.sources.reviewQueue, "string")
    assert.equal(typeof locale.jobImports.review.filters.allSources, "string")
    assert.equal(typeof locale.jobImports.review.correction.ruleHint, "string")
    assert.equal(typeof locale.jobImports.review.bulk.confirmClose, "string")
    assert.equal(typeof locale.jobImports.review.duplicates.description, "string")
  }
})
