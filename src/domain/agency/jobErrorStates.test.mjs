import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../../", import.meta.url)

const readSource = (path) => readFile(new URL(path, root), "utf8")

test("loads jobs, totals and compensation independently with retry UI", async () => {
  const page = await readSource("pages/admin/ManageJobsPage.jsx")

  assert.match(page, /const loadCompensation = useCallback/)
  assert.match(page, /Promise\.all\(\[loadJobs\(\), loadStats\(\), loadCompensation\(\)\]\)/)
  assert.match(page, /jobs_management\.compensation\.loadError/)
  assert.match(page, /onClick={loadCompensation}/)
  assert.match(page, /jobs_management\.compensation\.loading/)
  assert.match(page, /jobs_management\.compensation\.unavailable/)
})

test("status changes are optimistic and restore the exact snapshots on failure", async () => {
  const page = await readSource("pages/admin/ManageJobsPage.jsx")

  const mutation = page.slice(
    page.indexOf("const mutateJobState"),
    page.indexOf("const handleProvisionPublication"),
  )

  assert.match(mutation, /const jobsSnapshot = jobs/)
  assert.match(mutation, /setJobs\(jobsSnapshot\)/)
  assert.match(mutation, /setStats\(statsSnapshot\)/)
  assert.match(mutation, /setPagination\(paginationSnapshot\)/)
  assert.doesNotMatch(mutation, /refreshData\(/)
})

test("client loading and copy failures have explicit recovery", async () => {
  const modal = await readSource("components/employer/JobFormModal.jsx")

  assert.match(modal, /const loadAgencyClients = useCallback/)
  assert.match(modal, /onClick={loadAgencyClients}/)
  assert.match(modal, /await copyText\(text\)/)
  assert.match(modal, /copyState === "error"/)
})
