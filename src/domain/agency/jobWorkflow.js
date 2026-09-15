const LEGACY_EMPLOYMENT_TYPES = { full: 1, part: 2, daily: 6, remote: 1 }

export function getJobWorkflowDefaults(job = null) {
  const legacyType = job?.type || "full"

  return {
    employment_type_id: job?.employment_type_id ?? LEGACY_EMPLOYMENT_TYPES[legacyType] ?? 1,
    work_mode_id: job?.work_mode_id ?? (legacyType === "remote" ? 1 : 2),
  }
}

export function parseSkillsInput(value) {
  const result = []

  const seen = new Set()

  for (const raw of String(value || "").split(/[,;\n]/)) {
    const skill = raw.trim()

    const key = skill.toLocaleLowerCase()

    if (!skill || seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(skill)

    if (result.length === 50) {
      break
    }
  }

  return result
}

export function buildJobPipelinePath(path, jobId) {
  const [pathname, query = ""] = path.split("?")

  const params = new URLSearchParams(query)

  params.set("jobId", String(jobId))

  return `${pathname}?${params.toString()}`
}
