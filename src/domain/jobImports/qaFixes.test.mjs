import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { parseReviewSelection, agencyClientLabel } from "./qaFixes.js"
import { previewReadiness } from "./onboardingWizard.js"

test("review selection rejects empty, zero, negative, malformed and unsafe IDs", () => {
  for (const value of [null, "", ",", "0,-1,1e2,1.5,Infinity,9007199254740992"]) {
    assert.equal(parseReviewSelection(value).size, 0)
  }

  assert.deepEqual([...parseReviewSelection("2, 3,2,,4")], [2, 3, 4])
})

test("agency labels support actual flattened API and legacy nested records", () => {
  assert.equal(agencyClientLabel({ name: "לקוח Client", company: { name: "old" } }), "לקוח Client")
  assert.equal(agencyClientLabel({ company: { name: "Legacy" } }), "Legacy")
  assert.equal(agencyClientLabel(null, "Unavailable"), "Unavailable")
})

test("terminal failed preview cannot proceed to apply even with item counts", () => {
  for (const status of ["failed", "dead_letter", "cancelled"]) {
    assert.deepEqual(previewReadiness({ status, items_fetched: 2 }), {
      ready: false,
      reason: "failed",
    })
  }
})

test("AlertDialog exposes modal semantics and sample has inline failure recovery", () => {
  const dialog = readFileSync(
    new URL("../../components/ui/alert-dialog.jsx", import.meta.url),
    "utf8",
  )

  const wizard = readFileSync(
    new URL("../../pages/jobImports/JobImportNewPage.jsx", import.meta.url),
    "utf8",
  )

  assert.match(dialog, /aria-modal="true"/)
  assert.match(wizard, /sample.failed/)
  assert.match(wizard, /sample.retry/)
  assert.match(wizard, /localizedImportError\(previewRun.error/)
})

test("Tailwind generates numbered brand utilities without removing bare color classes", async () => {
  const require = createRequire(import.meta.url)

  const config = require("tailwindcss/loadConfig")(
    fileURLToPath(new URL("../../../tailwind.config.js", import.meta.url)),
  )

  const result = await require("postcss")([
    require("tailwindcss")({
      ...config,
      content: [
        {
          raw: '<button class="bg-violet-600 text-violet-700 bg-violet bg-cyan-600 bg-cyan"></button>',
          extension: "html",
        },
      ],
    }),
  ]).process("@tailwind utilities;", { from: undefined })

  for (const utility of [
    "bg-violet-600",
    "text-violet-700",
    "bg-violet",
    "bg-cyan-600",
    "bg-cyan",
  ]) {
    assert.ok(result.css.includes(`.${utility} {`))
  }
})
