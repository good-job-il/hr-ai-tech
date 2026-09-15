import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const pageUrl = new URL("../../pages/admin/ManageJobsPage.jsx", import.meta.url)

test("uses expandable job cards before the wide desktop breakpoint", async () => {
  const source = await readFile(pageUrl, "utf8")

  assert.match(source, /className="grid gap-3 2xl:hidden"/)
  assert.match(source, /aria-expanded={expanded}/)
  assert.match(source, /aria-controls={detailsId}/)
  assert.match(source, /expandedJobIds\.has\(job\.id\)/)
})

test("keeps the fixed desktop table wide-only without forced horizontal width", async () => {
  const source = await readFile(pageUrl, "utf8")

  assert.match(source, /className="hidden overflow-hidden 2xl:block"/)
  assert.match(source, /<table className="w-full table-fixed">/)
  assert.doesNotMatch(source, /min-w-\[1080px\]/)
  assert.doesNotMatch(source, /overflow-x-auto/)
})
