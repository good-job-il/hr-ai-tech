import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { buildJobPipelinePath, getJobWorkflowDefaults, parseSkillsInput } from "./jobWorkflow.js"

test("legacy remote jobs become full-time remote", () => {
  assert.deepEqual(getJobWorkflowDefaults({ type: "remote" }), {
    employment_type_id: 1,
    work_mode_id: 1,
  })
})

test("canonical taxonomy values win over legacy type", () => {
  assert.deepEqual(
    getJobWorkflowDefaults({ type: "full", employment_type_id: 5, work_mode_id: 3 }),
    { employment_type_id: 5, work_mode_id: 3 },
  )
})

test("skills are trimmed, case-insensitively deduplicated and accept lines", () => {
  assert.deepEqual(parseSkillsInput("TypeScript, Node.js\ntypescript; SQL"), [
    "TypeScript",
    "Node.js",
    "SQL",
  ])
})

test("pipeline path carries the selected job", () => {
  assert.equal(buildJobPipelinePath("/agency/pipeline", 42), "/agency/pipeline?jobId=42")
})

test("job form exposes the agency workflow as separate controls", async () => {
  const source = await readFile(
    new URL("../../components/employer/JobFormModal.jsx", import.meta.url),
    "utf8",
  )

  for (const controlId of [
    "job-form-employment-type",
    "job-form-work-mode",
    "job-form-required-skills",
    "job-form-preferred-skills",
    "job-form-seniority",
    "job-form-experience-years",
    "job-form-team-manager",
    "job-form-recruiter",
    "job-form-compensation-plan",
  ]) {
    assert.match(source, new RegExp(`id="${controlId}"`))
  }

  assert.doesNotMatch(source, /<option value="remote">/)
  assert.match(source, /created_by_user_id/)
  assert.match(source, /form\.source/)
})

test("pipeline consumes jobId as a server and exact local filter", async () => {
  const source = await readFile(new URL("../../hooks/usePipelineData.js", import.meta.url), "utf8")

  assert.match(source, /job_id: Number\(filters\.jobId\)/)
  assert.match(source, /Number\(application\.job_id\) === Number\(filters\.jobId\)/)
})
