import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const serviceSource = readFileSync(
  new URL("../../api/services/importSourceService.ts", import.meta.url),
  "utf8",
)

test("job import client queues an explicit preview and polls the tenant-scoped run", () => {
  assert.match(serviceSource, /mode:\s*"preview"/)
  assert.match(serviceSource, /post<QueuedImportRun>/)
  assert.match(serviceSource, /waitForRun\(queued\.run_id\)/)
  assert.match(serviceSource, /getRun\(runId/)
  assert.match(serviceSource, /job_changes_applied:\s*false/)
  assert.equal(serviceSource.includes('post<ImportPreviewResult>("/import-sources/preview"'), false)
})
