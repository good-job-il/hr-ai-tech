import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import {
  changedImportManagedFields,
  importFieldState,
  isImportedJob,
  safeExternalJobUrl,
} from "./jobImportProvenance.js"

const provenance = {
  imported: true,
  field_ownership: {
    title: "source_until_edited",
    required_skills: "source_until_edited",
    domain_id: "review_on_conflict",
    recruiter_id: "user",
  },
  manual_overrides: {},
}

test("recognizes imported jobs and field sync state", () => {
  assert.equal(isImportedJob({ source_job_record_id: 8 }), true)
  assert.equal(importFieldState(provenance, "title"), "source")
  assert.equal(
    importFieldState({ ...provenance, manual_overrides: { title: { field: "title" } } }, "title"),
    "manual",
  )
  assert.equal(importFieldState(provenance, "recruiter_id"), "none")
})

test("external posting links only allow http and https", () => {
  assert.equal(safeExternalJobUrl("javascript:alert(1)"), null)
  assert.equal(safeExternalJobUrl("not a url"), null)
  assert.equal(safeExternalJobUrl("https://vendor.test/jobs/1"), "https://vendor.test/jobs/1")
})

test("only newly edited source-managed fields require confirmation", () => {
  const job = { title: "Engineer", required_skills: ["SQL"], recruiter_id: 5, domain_id: 17 }
  const form = {
    title: "Senior Engineer",
    required_skills_text: "SQL",
    recruiter_id: 9,
  }

  assert.deepEqual(changedImportManagedFields(job, form, provenance), ["title"])

  assert.deepEqual(
    changedImportManagedFields(job, form, {
      ...provenance,
      manual_overrides: { title: { field: "title" } },
    }),
    [],
  )
})

test("job UI exposes provenance, history, links and override confirmation", async () => {
  const [form, list] = await Promise.all([
    readFile(new URL("../../components/employer/JobFormModal.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../pages/admin/ManageJobsPage.jsx", import.meta.url), "utf8"),
  ])

  assert.match(list, /jobs_management\.imported/)
  assert.match(form, /source_posting_url/)
  assert.match(form, /last_successful_run_id/)
  assert.match(form, /latest_run_item/)
  assert.match(form, /importProvenance\.history/)
  assert.match(form, /changedImportManagedFields/)
  assert.match(form, /handleResumeSourceSync/)
})
