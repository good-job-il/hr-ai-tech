import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import {
  DEFAULT_JOB_IMPORT_FEATURE_FLAGS,
  JOB_IMPORT_FEATURE_FLAGS,
  isJobImportFeatureEnabled,
  resolveJobImportFeatureFlags,
} from "./jobImportFeatureFlags.js"

test("access uses backend effective flags including inherited plan values", () => {
  assert.equal(
    resolveJobImportFeatureFlags({ effective_feature_flags: { job_imports_enabled: true } })
      .job_imports_enabled,
    true,
  )
  assert.equal(
    resolveJobImportFeatureFlags({
      settings: { feature_flags: { job_imports_enabled: true } },
      effective_feature_flags: { job_imports_enabled: false },
    }).job_imports_enabled,
    false,
  )
})

test("job import flags are opt-in", () => {
  assert.deepEqual(resolveJobImportFeatureFlags(null), DEFAULT_JOB_IMPORT_FEATURE_FLAGS)
})

test("plan matrix and override screens use server state instead of browser-local flags", () => {
  const source = readFileSync(new URL("../pages/platform/FlagsPage.jsx", import.meta.url), "utf8")

  assert.ok(source.includes("/billing/feature-flags"))
  assert.ok(source.includes("persistedMatrix"))
  assert.ok(!source.includes("localStorage"))
  assert.ok(!source.includes("loadMatrix"))
})

test("organization boolean overrides are resolved", () => {
  const organization = {
    settings: {
      feature_flags: {
        [JOB_IMPORT_FEATURE_FLAGS.ENABLED]: true,
        [JOB_IMPORT_FEATURE_FLAGS.AUTO_APPLY_ENABLED]: false,
        [JOB_IMPORT_FEATURE_FLAGS.HTML_BETA_ENABLED]: true,
      },
    },
  }

  assert.equal(isJobImportFeatureEnabled(organization, JOB_IMPORT_FEATURE_FLAGS.ENABLED), true)
  assert.equal(
    isJobImportFeatureEnabled(organization, JOB_IMPORT_FEATURE_FLAGS.AUTO_APPLY_ENABLED),
    false,
  )
  assert.equal(
    isJobImportFeatureEnabled(organization, JOB_IMPORT_FEATURE_FLAGS.HTML_BETA_ENABLED),
    true,
  )
})

test("non-boolean overrides cannot enable a feature", () => {
  assert.deepEqual(
    resolveJobImportFeatureFlags({
      settings: {
        feature_flags: {
          job_imports_enabled: "true",
          job_imports_auto_apply_enabled: 1,
        },
      },
    }),
    DEFAULT_JOB_IMPORT_FEATURE_FLAGS,
  )
})
