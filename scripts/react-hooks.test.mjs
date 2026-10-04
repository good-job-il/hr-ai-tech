import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { ESLint } from "eslint"

const options = { overrideConfigFile: "eslint.hooks.config.js" }
const missingDependency = `import { useEffect } from "react";
export function Example({ candidate }) {
  useEffect(() => { console.log(candidate.id); }, []);
  return null;
}`

test("missing dependencies are errors, not hidden warnings", async () => {
  const [result] = await new ESLint(options).lintText(missingDependency, {
    filePath: "src/hooks-regression.jsx",
  })
  assert.equal(result.messages[0].ruleId, "react-hooks/exhaustive-deps")
  assert.equal(result.messages[0].severity, 2)
})

test("lint fix never blindly adds reactive dependencies", async () => {
  const [result] = await new ESLint({ ...options, fix: true }).lintText(missingDependency, {
    filePath: "src/hooks-regression.jsx",
  })
  assert.equal(result.output, undefined)
  assert.equal(result.errorCount, 1)
})

test("conditional Hooks are rejected", async () => {
  const [result] = await new ESLint(options).lintText(
    `import { useEffect } from "react";
     export function Example({ enabled }) {
       if (enabled) { useEffect(() => {}, []); }
       return null;
     }`,
    { filePath: "src/hooks-regression.jsx" },
  )
  assert.ok(result.messages.some((message) => message.ruleId === "react-hooks/rules-of-hooks"))
})

test("all client source files pass Hooks checks", async () => {
  const results = await new ESLint(options).lintFiles(["src"])
  const failures = results.flatMap((result) =>
    result.messages.map((message) => `${result.filePath}:${message.line}: ${message.message}`),
  )
  assert.deepEqual(failures, [])
})

test("candidate pagination does not put mutable page state in fetch dependencies", async () => {
  const source = await readFile("src/pages/crm/CandidateListCRMPage.jsx", "utf8")
  assert.match(source, /append = false, requestedPage = 1/)
  assert.match(source, /loadCandidates\(true, page \+ 1\)/)
  assert.doesNotMatch(source, /requestedPage = append \? page/)
})

test("profile initialization preserves an edited form via a functional update", async () => {
  const source = await readFile("src/pages/candidate/CandidateProfile.jsx", "utf8")
  assert.match(source, /setForm\(\(current\) =>/)
  assert.match(source, /if \(current !== null\) \{\s*return current/)
})
