import assert from "node:assert/strict"
import test from "node:test"
import { copyText } from "./clipboard.js"

test("copyText resolves only after the clipboard write succeeds", async () => {
  let copied = ""

  await copyText("HI-123", { writeText: async (value) => (copied = value) })

  assert.equal(copied, "HI-123")
})

test("copyText exposes unavailable and rejected clipboard writes", async () => {
  await assert.rejects(() => copyText("value", null), /unavailable/)
  await assert.rejects(() =>
    copyText("value", { writeText: async () => Promise.reject(new Error("denied")) }),
  )
})
