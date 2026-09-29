import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const page = readFileSync(new URL("../../pages/platform/FlagsPage.jsx", import.meta.url), "utf8")

test("feature state is visible as text and exposed to assistive technology", () => {
  assert.match(page, /aria-pressed=\{value\}/)
  assert.match(page, /value \? "Enabled" : "Disabled"/)
  assert.match(page, /bg-emerald-600/)
  assert.match(page, /bg-slate-100 text-slate-700/)
})

test("organization cards distinguish inherited and overridden values", () => {
  assert.match(page, /Organization override/)
  assert.match(page, /Inherited/)
  assert.match(page, /Plan default:/)
  assert.match(page, /Effective state/)
  assert.match(page, /Use plan default/)
})

test("resetting saved overrides and discarding unsaved edits are separate actions", () => {
  assert.match(page, /handleResetToPlan/)
  assert.match(page, /FEATURES\.forEach\(\(\{ id \}\) => delete nextFlags\[id\]\)/)
  assert.match(page, /handleDiscardChanges/)
  assert.match(page, /Reset to plan/)
  assert.match(page, /Discard edits/)
})

test("save feedback remains readable in clean, dirty, success and error states", () => {
  assert.match(page, /Unsaved organization changes/)
  assert.match(page, /Overrides saved successfully/)
  assert.match(page, /Could not save overrides\. Try again\./)
  assert.match(page, /role="status"/)
})
