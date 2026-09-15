export function normalizeCompanyId(value) {
  return value == null ? "" : String(value)
}

export function resolveJobClientSelection({ clients = [], job = null, selectedCompanyId = "" }) {
  const activeClients = clients.filter((client) => client.status === "active")

  const currentCompanyId = normalizeCompanyId(job?.employer_company_id)

  const selectedId = normalizeCompanyId(selectedCompanyId)

  const currentClient = clients.find(
    (client) => normalizeCompanyId(client.company_id) === currentCompanyId,
  )

  const selectedActiveClient = activeClients.find(
    (client) => normalizeCompanyId(client.company_id) === selectedId,
  )

  let issue = ""

  let issueKey = ""

  let issueValues = {}

  if (!selectedActiveClient) {
    if (!job) {
      issue = "Select an active agency client before saving."
      issueKey = "clientIssueNew"
    } else if (!currentCompanyId) {
      issue = `This legacy job (${job.company || "unknown company"}) is not linked to an agency client. Select an active client before saving.`
      issueKey = "clientIssueUnlinked"
      issueValues = { company: job.company || "" }
    } else if (!currentClient) {
      issue = `The current company (${job.company || currentCompanyId}) is unavailable in this agency. Select an active client before saving.`
      issueKey = "clientIssueUnavailable"
      issueValues = { company: job.company || currentCompanyId }
    } else {
      issue = `The current client is ${currentClient.status}. Select an active client before saving.`
      issueKey = "clientIssueStatus"
      issueValues = { status: currentClient.status }
    }
  }

  return {
    activeClients,
    currentClient,
    currentCompanyId,
    selectedActiveClient,
    issue,
    issueKey,
    issueValues,
  }
}
