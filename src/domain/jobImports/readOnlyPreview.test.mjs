import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const serviceSource = readFileSync(
  new URL("../../api/services/importSourceService.ts", import.meta.url),
  "utf8",
)

test("job import client queues an explicit preview and waits for its typed result", () => {
  assert.match(serviceSource, /mode:\s*"preview"/)
  assert.match(serviceSource, /waitForJob<ImportPreviewResult>/)
  assert.match(serviceSource, /job_changes_applied:\s*false/)
  assert.equal(serviceSource.includes('post<ImportPreviewResult>("/import-sources/preview"'), false)
})
