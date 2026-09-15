import assert from "node:assert/strict"
import test from "node:test"
import { normalizeCompanyId, resolveJobClientSelection } from "./jobClientSelection.js"

test("normalizes null company IDs for controlled select values", () => {
  assert.equal(normalizeCompanyId(null), "")
  assert.equal(normalizeCompanyId(undefined), "")
  assert.equal(normalizeCompanyId(42), "42")
})

test("accepts a canonical active AgencyClient", () => {
  const result = resolveJobClientSelection({
    clients: [{ id: 1, company_id: 42, name: "Acme", status: "active" }],
    job: { employer_company_id: 42, company: "Acme" },
    selectedCompanyId: "42",
  })

  assert.equal(result.selectedActiveClient?.id, 1)
  assert.equal(result.issue, "")
})

test("keeps an archived current client visible but requires an active replacement", () => {
  const result = resolveJobClientSelection({
    clients: [
      { id: 1, company_id: 42, name: "Legacy", status: "archived" },
      { id: 2, company_id: 7, name: "Current", status: "active" },
    ],
    job: { employer_company_id: 42, company: "Legacy" },
    selectedCompanyId: 42,
  })

  assert.equal(result.currentClient?.status, "archived")
  assert.equal(result.selectedActiveClient, undefined)
  assert.match(result.issue, /archived/)
})

test("returns an explicit migration state for a job without a relationship", () => {
  const result = resolveJobClientSelection({
    clients: [],
    job: { employer_company_id: null, company: "Legacy Co" },
    selectedCompanyId: null,
  })

  assert.match(result.issue, /not linked to an agency client/)
})
