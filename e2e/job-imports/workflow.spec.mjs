import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { installImportFixture } from "./fixture.mjs"

const translations = Object.fromEntries(
  ["en", "he"].map((lang) => [
    lang,
    JSON.parse(
      readFileSync(new URL(`../../src/locales/${lang}/translation.json`, import.meta.url), "utf8"),
    ),
  ]),
)

for (const language of ["en", "he"]) {
  for (const width of [320, 768, 1280]) {
    test(`${language} dashboard ${width}px: readable actions and safe archive dialog`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      const fixture = await installImportFixture(page, { language })
      const t = translations[language]
      await page.goto("/agency/import/jobs")
      await expect(page.getByText("Fixture משרות", { exact: true })).toBeVisible()
      const archive = page
        .getByRole("button", {
          name: t.jobImports.sources.actions.archiveNamed.replace("{{name}}", "Fixture משרות"),
          exact: true,
        })
        .first()
      await archive.focus()
      await page.keyboard.press("Enter")
      const dialog = page.getByRole("alertdialog")
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveAttribute("aria-modal", "true")
      await expect
        .poll(() =>
          dialog.evaluate((element) =>
            element.getAnimations().every((animation) => animation.playState === "finished"),
          ),
        )
        .toBe(true)
      await expect
        .poll(() =>
          page.evaluate(() => Boolean(document.activeElement?.closest('[role="alertdialog"]'))),
        )
        .toBe(true)
      await page.keyboard.press("Tab")
      await page.keyboard.press("Shift+Tab")
      await expect
        .poll(() =>
          page.evaluate(() => Boolean(document.activeElement?.closest('[role="alertdialog"]'))),
        )
        .toBe(true)
      await page.keyboard.press("Escape")
      await expect(dialog).toBeHidden()
      await expect(archive).toBeFocused()
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        )
        .toBe(true)
      expect(fixture.requests.some((r) => r.method === "DELETE")).toBe(false)
      expect(fixture.unknown).toEqual([])
    })
  }
}

test("revoked view and disabled feature have distinct access states", async ({ browser }) => {
  for (const options of [
    { view: false, enabled: true, key: "deniedTitle" },
    { view: true, enabled: false, key: "disabledTitle" },
  ]) {
    const context = await browser.newContext()
    const page = await context.newPage()
    const fixture = await installImportFixture(page, options)
    await page.goto("/agency/import/jobs")
    await expect(
      page.getByRole("heading", { name: translations.en.jobImports.access[options.key] }),
    ).toBeVisible()
    expect(fixture.requests.some((r) => r.path === "/import-sources/dashboard")).toBe(false)
    await context.close()
  }
})

test("sample renders raw HTML as text, preview never applies, refresh restores draft", async ({
  page,
}) => {
  const fixture = await installImportFixture(page)
  fixture.source.onboarding_step = 4
  fixture.source.onboarding_state.preview_run_id = 903
  await page.goto("/agency/import/jobs/new?sourceId=901")
  await expect(page.getByText("Engineer מהנדס", { exact: true })).toBeVisible()
  await expect(page.locator('img[src="x"]')).toHaveCount(0)
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
  await page.reload()
  await expect(page.getByText("Engineer מהנדס", { exact: true })).toBeVisible()
  expect(fixture.requests.some((r) => r.path.endsWith("/apply"))).toBe(false)
  expect(fixture.unknown).toEqual([])
})

for (const language of ["en", "he"]) {
  test(`${language} keyboard wizard: source → preview → mapping → dry-run → confirmed apply`, async ({
    page,
  }) => {
    const fixture = await installImportFixture(page, { language })
    const t = translations[language]
    const keyboardActivate = async (locator) => {
      await expect(locator).toBeEnabled()
      await locator.focus()
      await page.keyboard.press("Enter")
    }
    const next = () =>
      keyboardActivate(page.getByRole("button", { name: t.common.continue, exact: true }))
    await page.goto("/agency/import/jobs/new")
    await page
      .getByLabel(t.jobImports.wizard.source.url, { exact: false })
      .fill("https://jobs.fixture.test/feed.json")
    await next()
    await page.getByLabel(t.jobImports.wizard.client.label, { exact: false }).selectOption("902")
    await next()
    await expect(
      page.getByRole("heading", { name: t.jobImports.wizard.titles.connection, exact: true }),
    ).toBeVisible()
    await next()
    await expect(
      page.getByRole("heading", { name: t.jobImports.wizard.titles.sample, exact: true }),
    ).toBeVisible()
    await keyboardActivate(
      page.getByRole("button", { name: t.jobImports.wizard.sample.run, exact: true }),
    )
    await expect(page.getByText("Engineer מהנדס", { exact: true })).toBeVisible()
    expect(fixture.requests.some((r) => r.path.endsWith("/apply"))).toBe(false)
    await next()
    await page.getByLabel(t.jobImports.wizard.mapping.schedule, { exact: false }).selectOption("0")
    await next()
    await expect(
      page.getByRole("heading", { name: t.jobImports.wizard.titles.dryRun, exact: true }),
    ).toBeVisible()
    await keyboardActivate(
      page.getByRole("button", { name: t.jobImports.wizard.dryRun.run, exact: true }),
    )
    await expect(page.getByText("Engineer מהנדס", { exact: true })).toBeVisible()
    await next()
    const apply = page.getByRole("button", {
      name: t.jobImports.wizard.confirmation.apply,
      exact: true,
    })
    await expect(apply).toBeDisabled()
    const confirm = page.getByRole("checkbox", { name: t.jobImports.wizard.confirmation.confirm })
    await confirm.focus()
    await page.keyboard.press("Space")
    await keyboardActivate(apply)
    await expect(page).toHaveURL(/\/agency\/import\/jobs\/901$/)
    const applyRequests = fixture.requests.filter((r) => r.path.endsWith("/apply"))
    expect(applyRequests).toHaveLength(1)
    expect(applyRequests[0].body.idempotency_key).toBeTruthy()
    expect(
      fixture.requests.filter((r) => r.path.endsWith("/runs") && r.method === "POST"),
    ).toHaveLength(2)
    expect(fixture.requests.some((r) => r.path.endsWith("/resume"))).toBe(false)
    expect(fixture.unknown).toEqual([])
  })
}

test("pause/resume and explicit archive retain user control", async ({ page }) => {
  const fixture = await installImportFixture(page)
  const t = translations.en.jobImports.sources
  fixture.source.state = "active"
  await page.goto("/agency/import/jobs")
  await page.getByRole("button", { name: t.actions.pause, exact: true }).click()
  await expect(page.getByRole("button", { name: t.actions.resume, exact: true })).toBeVisible()
  await page.getByRole("button", { name: t.actions.resume, exact: true }).click()
  await expect(page.getByRole("button", { name: t.actions.pause, exact: true })).toBeVisible()
  await page
    .getByRole("button", {
      name: t.actions.archiveNamed.replace("{{name}}", fixture.source.name),
      exact: true,
    })
    .click()
  expect(fixture.requests.some((r) => r.method === "DELETE")).toBe(false)
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: t.actions.archive, exact: true })
    .click()
  await expect(page.getByText("Fixture משרות", { exact: true })).toHaveCount(0)
  expect(fixture.requests.filter((r) => r.method === "DELETE")).toHaveLength(1)
  expect(fixture.unknown).toEqual([])
})

test("failed sample has actionable retry and cannot apply jobs", async ({ page }) => {
  const fixture = await installImportFixture(page)
  const t = translations.en.jobImports.wizard
  fixture.source.onboarding_step = 4
  fixture.run.status = "failed"
  fixture.run.error = {
    code: "RATE_LIMITED",
    message: "Retry later",
    retryable: true,
    retry_after_seconds: 60,
  }
  await page.goto("/agency/import/jobs/new?sourceId=901")
  await page.getByRole("button", { name: t.sample.run, exact: true }).click()
  await expect(page.getByText(t.sample.failed, { exact: true })).toBeVisible()
  fixture.run.status = "completed"
  fixture.run.error = null
  await page.getByRole("button", { name: t.sample.retry, exact: true }).click()
  await expect(page.getByText(t.sample.failed, { exact: true })).toHaveCount(0)
  await expect(page.getByText("Engineer מהנדס", { exact: true })).toBeVisible()
  expect(
    fixture.requests.filter((r) => r.path.endsWith("/runs") && r.method === "POST"),
  ).toHaveLength(2)
  expect(fixture.requests.some((r) => r.path.endsWith("/apply"))).toBe(false)
  expect(fixture.unknown).toEqual([])
})

test("stale conflict cannot approve; rejection requires reason and preserves URL filters", async ({
  page,
}) => {
  const fixture = await installImportFixture(page)
  const t = translations.en.jobImports.review
  fixture.items[0].proposed_action = "review"
  fixture.items[0].stale = true
  fixture.items[0].current_job = { id: 905, title: "Manual title" }
  fixture.items[0].field_diff = { title: { before: "Manual title", after: "Engineer מהנדס" } }
  await page.goto("/agency/import/jobs/review?action=review&issue=STALE_ITEM_CONFLICT")
  await expect(page.getByRole("button", { name: t.actions.approve, exact: true })).toBeDisabled()
  await page.getByRole("button", { name: t.actions.reject, exact: true }).click()
  await expect(page.getByText(t.reasonRequired, { exact: true })).toBeVisible()
  expect(fixture.requests.some((r) => r.path.endsWith("/reject"))).toBe(false)
  await page.getByLabel(t.reason, { exact: true }).fill("Keep the recruiter's manual changes")
  await page.getByRole("button", { name: t.actions.reject, exact: true }).click()
  await expect.poll(() => fixture.requests.filter((r) => r.path.endsWith("/reject")).length).toBe(1)
  await expect(page).toHaveURL(/action=review.*issue=STALE_ITEM_CONFLICT/)
  expect(fixture.requests.find((r) => r.path.endsWith("/reject")).body.idempotency_key).toBeTruthy()
  expect(fixture.requests.some((r) => r.path.endsWith("/apply"))).toBe(false)
  expect(fixture.unknown).toEqual([])
})

test("job edit displays provenance and manual lock even when the source is archived", async ({
  page,
}) => {
  const fixture = await installImportFixture(page)
  const t = translations.en.jobs_management
  await page.goto("/agency/jobs/open")
  await expect(
    page.getByText("Imported Fixture Position", { exact: true }).filter({ visible: true }),
  ).toBeVisible()
  await expect(page.getByText(t.imported, { exact: true }).filter({ visible: true })).toBeVisible()
  await page.getByRole("button", { name: t.edit, exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText(t.form.importProvenance, { exact: true })).toBeVisible()
  await expect(dialog.getByText(t.form.fieldSync.manual, { exact: true })).toBeVisible()
  await expect(
    dialog.getByRole("link", { name: t.form.externalPosting, exact: true }),
  ).toHaveAttribute("href", "https://jobs.fixture.test/posting/1")
  await expect(dialog.getByRole("textbox", { name: t.form.title, exact: false })).toBeEnabled()
  expect(fixture.requests.some((r) => r.path === "/jobs/905" && r.method === "PATCH")).toBe(false)
  expect(fixture.unknown).toEqual([])
})

for (const language of ["en", "he"]) {
  test(`${language} legacy archival provenance is editable and never promises synchronization`, async ({ page }) => {
    const fixture = await installImportFixture(page, { language, legacyArchive: true })
    const t = translations[language].jobs_management
    await page.goto("/agency/jobs/open")
    await page.getByRole("button", { name: t.edit, exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText(t.form.legacyArchiveDescription, { exact: true })).toBeVisible()
    await expect(dialog.getByText(t.form.fieldSync.archived, { exact: true })).toBeVisible()
    await expect(dialog.getByText(t.form.importSourceManaged, { exact: true })).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: t.form.resumeSourceSync, exact: true })).toHaveCount(0)
    await expect(dialog.getByRole("textbox", { name: t.form.title, exact: false })).toBeEnabled()
    await dialog.getByText(t.form.importHistory, { exact: true }).click()
    await expect(dialog.getByText(t.form.history.job_import_migration, { exact: true })).toBeVisible()
    expect(fixture.unknown).toEqual([])
  })
}
