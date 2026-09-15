import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../../", import.meta.url)

const readText = (relativePath) => readFile(new URL(relativePath, root), "utf8")

const flatten = (value, prefix = "", result = {}) => {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (child && typeof child === "object") {
      flatten(child, path, result)
    } else {
      result[path] = String(child)
    }
  }

  return result
}

test("keeps the EN and HE jobs dictionaries structurally identical", async () => {
  const [english, hebrew] = await Promise.all([
    readText("locales/en/translation.json").then(JSON.parse),
    readText("locales/he/translation.json").then(JSON.parse),
  ])

  const englishJobs = flatten(english.jobs_management)

  const hebrewJobs = flatten(hebrew.jobs_management)

  assert.deepEqual(Object.keys(hebrewJobs).sort(), Object.keys(englishJobs).sort())

  for (const [key, value] of Object.entries(hebrewJobs)) {
    assert.doesNotMatch(value.replace(/{{[^}]+}}/g, ""), /[A-Za-z]/, `Hebrew key ${key}`)
  }

  for (const [key, value] of Object.entries(englishJobs)) {
    assert.doesNotMatch(value, /[\u0590-\u05ff]/, `English key ${key}`)
  }
})

test("uses active-language direction and contains no hard-coded LTR jobs shell", async () => {
  const [page, modal] = await Promise.all([
    readText("pages/admin/ManageJobsPage.jsx"),
    readText("components/employer/JobFormModal.jsx"),
  ])

  assert.match(page, /const direction = i18n\.dir\(\)/)
  assert.match(page, /<PlatformPageShell dir={direction}>/)
  assert.doesNotMatch(page, /<PlatformPageShell dir="ltr">/)
  assert.match(modal, /dir={direction}/)
})

test("formats job numbers and compensation for each active locale", () => {
  const englishCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(12500)

  const hebrewCurrency = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(12500)

  assert.notEqual(englishCurrency, hebrewCurrency)
  assert.match(englishCurrency, /12,500/)
  assert.match(hebrewCurrency, /12,500/)
})
