// Browser workflow tests use a stateful API fixture, NOT a production session.
// Every API call is intercepted. No external URL or real backend is reachable.
export async function installImportFixture(
  page,
  { language = "en", view = true, enabled = true, legacyArchive = false } = {},
) {
  const requests = []
  const unknown = []
  const source = {
    id: 901,
    organization_id: 901,
    employer_company_id: 902,
    name: "Fixture משרות",
    url: "https://jobs.fixture.test/feed.json",
    connector_type: "generic_json",
    connector_version: "1.0.0",
    state: "draft",
    configuration: {},
    configuration_version: 1,
    mapping_version: 1,
    onboarding_step: 1,
    onboarding_state: {},
    interval_hours: 0,
    is_active: false,
    next_run_at: null,
    last_success_at: null,
    publish_policy: "draft",
    closing_policy: "disabled",
    missing_grace_runs: 2,
    operational_status: "paused",
    health_state: "unknown",
  }
  const counts = { create: 1, update: 0, close: 0, reopen: 0, skip: 0, review: 0, error: 0 }
  const run = {
    id: 903,
    import_source_id: 901,
    organization_id: 901,
    mode: "preview",
    status: "completed",
    snapshot_completeness: "full",
    configuration_version: 1,
    items_fetched: 1,
    pages_fetched: 1,
    ...Object.fromEntries(Object.entries(counts).map(([k, v]) => [`${k}_count`, v])),
    confirmation_metadata: { reconciliation: { requires_review: false, reasons: [] } },
    error: null,
    job_changes_applied: false,
  }
  const items = [
    {
      id: 904,
      job_import_run_id: 903,
      organization_id: 901,
      external_key: "fixture-1",
      proposed_action: "create",
      status: "pending",
      confidence: 1,
      validation_issues: [],
      normalized_candidate: {
        title: "Engineer מהנדס",
        source_company_label: "Fixture Client",
        description: "Build APIs",
        locations: [],
      },
      source_payload: { title: '<img src=x onerror="window.__xss = true">Engineer' },
      field_diff: {},
    },
  ]
  const envelope = (data) => ({
    data,
    pagination: { page: 1, limit: 20, total: data.length, totalPages: 1 },
  })
  const catalog = [
    {
      type: "generic_json",
      version: "1.0.0",
      capabilities: ["full_snapshot"],
      limitations: [],
      available: true,
    },
  ]
  await page.addInitScript(
    ({ language }) => {
      localStorage.setItem("access_token", "isolated-fixture-token")
      localStorage.setItem("hhLang", language)
    },
    { language },
  )
  await page.route("**/*", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== "http://127.0.0.1:5188") return route.abort()
    if (!url.pathname.startsWith("/api/")) return route.continue()
    const path = url.pathname.slice(4)
    const method = request.method()
    requests.push({ path, method, body: request.postDataJSON() })
    const respond = (body, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
    if (path === "/auth/me")
      return respond({
        id: 901,
        role: "org_admin",
        organization_id: 901,
        org_type: "staffing_agency",
        full_name: "Fixture Admin",
      })
    if (path === "/organizations/901")
      return respond({
        id: 901,
        name: "Fixture Agency",
        org_type: "staffing_agency",
        plan: "enterprise",
        effective_feature_flags: { job_imports_enabled: enabled },
        settings: { feature_flags: { job_imports_enabled: enabled } },
      })
    if (path === "/permissions/effective")
      return respond({
        permissions: {
          view: true,
          create: true,
          update: true,
          resources: {
            job_imports: {
              view,
              create: true,
              update: true,
              run: true,
              review: true,
              archive: true,
            },
          },
        },
      })
    if (path === "/job-import-connectors") return respond({ data: catalog })
    if (path === "/agency-clients")
      return respond(
        envelope([
          {
            id: 902,
            company_id: 902,
            status: "active",
            company: { id: 902, name: "Fixture Client" },
          },
        ]),
      )
    if (path === "/agency-teams") return respond({ teams: [], members: [] })
    if (path === "/audit-logs") return respond(envelope([]))
    if (path === "/compensation-plans") return respond(envelope([]))
    if (path === "/taxonomy")
      return respond({
        domains: [],
        roles: [],
        specializations: [],
        employmentTypes: [],
        workModes: [],
        experienceLevels: [],
      })
    if (path === "/jobs/stats") return respond({ total: 1, open: 1, closed: 0 })
    if (path === "/jobs")
      return respond(
        envelope([
          {
            id: 905,
            title: "Imported Fixture Position",
            company: "Fixture Client",
            employer_company_id: 902,
            organization_id: 901,
            state: "open",
            source: "import",
            source_job_record_id: 906,
            category: "engineering",
            type: "full",
            required_skills: [],
            preferred_skills: [],
            job_code: "HI-1234567890",
            apply_email: "jobs+fixture@apply.fixture.test",
            apply_url: "https://platform.fixture.test/jobs/HI-1234567890",
          },
        ]),
      )
    if (path === "/jobs/905/import-provenance")
      return respond({
        imported: true,
        legacy_archive: legacyArchive,
        original_source_identity: legacyArchive ? "unknown" : null,
        source_job_record_id: 906,
        source: { ...source, state: "archived", available: false, health_state: "degraded" },
        client: { id: 902, name: "Fixture Client", available: true },
        source_posting_url: legacyArchive ? null : "https://jobs.fixture.test/posting/1",
        field_ownership: { title: "source_until_edited" },
        manual_overrides: legacyArchive ? {} : { title: { actor_id: 901 } },
        history: legacyArchive ? [{ id: 1, origin: "job_import_migration", action: "update", created_at: "2026-10-04T12:00:00Z" }] : [],
        can_resume_sync: false,
      })
    if (path === "/job-imports/health")
      return respond({ total_sources: 1, by_status: { paused: 1 }, runs: {}, review_count: 0 })
    if (path === "/import-sources/dashboard")
      return respond(envelope(source.state === "archived" ? [] : [{ ...source }]))
    if (path === "/import-sources") return respond(envelope([{ ...source }]))
    if (path === "/job-imports/review-items") return respond(envelope(items))
    if (path === "/import-run-items/904/reject") {
      items[0].status = "rejected"
      return respond(items[0])
    }
    if (path === "/import-sources/onboarding-drafts") {
      Object.assign(source, request.postDataJSON(), { onboarding_step: 2 })
      return respond(source, 201)
    }
    if (path === "/import-sources/901") {
      if (method === "PATCH") Object.assign(source, request.postDataJSON())
      if (method === "DELETE") {
        source.state = "archived"
        return route.fulfill({ status: 204 })
      }
      return respond(source)
    }
    if (path === "/import-sources/901/discover")
      return respond({
        connector_type: "generic_json",
        connector_version: "1.0.0",
        capabilities: ["full_snapshot"],
        limitations: [],
        source_metadata: {},
      })
    if (path === "/import-sources/901/runs")
      return method === "POST"
        ? respond({ run_id: 903, status: "pending" }, 202)
        : respond(envelope([run]))
    if (path === "/import-runs/903") return respond(run)
    if (path === "/import-runs/903/items") return respond(envelope(items))
    if (path === "/import-runs/903/apply")
      return respond({ run_id: 903, applied: 1, failed: 0, skipped: 0, items: [] }, 202)
    if (path === "/import-sources/901/pause") {
      source.state = "paused"
      return respond(source)
    }
    if (path === "/import-sources/901/resume") {
      source.state = "active"
      return respond(source)
    }
    // Shell dependencies are read-only fixtures; unknown mutations always fail.
    if (
      method === "GET" &&
      ["/notifications", "/messages", "/billing/subscription", "/agency-dashboard"].includes(path)
    )
      return respond(envelope([]))
    unknown.push(`${method} ${path}`)
    return respond({ message: `Unimplemented test fixture: ${method} ${path}` }, 501)
  })
  return { requests, unknown, source, run, items }
}
