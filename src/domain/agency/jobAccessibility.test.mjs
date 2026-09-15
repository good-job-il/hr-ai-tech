import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const sourceRoot = new URL("../../", import.meta.url)

const readSource = (path) => readFile(new URL(path, sourceRoot), "utf8")

test("uses the shared modal dialog with labelled title and managed initial focus", async () => {
  const [modal, dialog] = await Promise.all([
    readSource("components/employer/JobFormModal.jsx"),
    readSource("components/ui/dialog.jsx"),
  ])

  assert.match(modal, /<Dialog open={isOpen}/)
  assert.match(modal, /<DialogContent/)
  assert.match(modal, /aria-labelledby={titleId}/)
  assert.match(modal, /<DialogTitle id={titleId}/)
  assert.match(modal, /onOpenAutoFocus=/)
  assert.match(modal, /titleInputRef\.current\?\.focus\(\)/)
  assert.match(modal, /<DialogClose asChild>/)
  assert.doesNotMatch(modal, /fixed inset-0 bg-black\/50/)

  assert.match(dialog, /DialogPrimitive\.Root/)
  assert.match(dialog, /DialogPrimitive\.Overlay/)
  assert.match(dialog, /DialogPrimitive\.Content/)
  assert.match(dialog, /DialogPrimitive\.Close/)
})

test("labels search, status controls and icon-only job actions", async () => {
  const [page, modal] = await Promise.all([
    readSource("pages/admin/ManageJobsPage.jsx"),
    readSource("components/employer/JobFormModal.jsx"),
  ])

  assert.match(page, /<label htmlFor="agency-jobs-search" className="sr-only">/)
  assert.match(page, /id="agency-jobs-search"/)
  assert.ok((page.match(/jobs_management\.statusFor/g) || []).length >= 2)
  assert.match(page, /aria-label={t\("jobs_management\.refresh"\)}/)
  assert.ok((page.match(/aria-label={t\("jobs_management\.edit"\)}/g) || []).length >= 2)
  assert.match(modal, /aria-label={t\("jobs_management\.form\.close"\)}/)
  assert.match(modal, /htmlFor="job-form-state"/)
  assert.match(modal, /id="job-form-state"/)
})
