const IMPORT_MANAGED_OWNERSHIP = new Set(["source_until_edited", "review_on_conflict"])

const EDITABLE_IMPORT_FIELDS = new Set([
  "title",
  "description",
  "location",
  "employment_type_id",
  "work_mode_id",
  "required_skills",
  "preferred_skills",
  "salary_min",
  "salary_max",
  "state",
  "category",
  "seniority",
  "years_experience_required",
])

const arrayValue = (value) =>
  Array.isArray(value)
    ? value
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean)
    : String(value || "")
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)

const comparable = (value) => (value === undefined || value === "" ? null : value)

function originalValue(job, field) {
  if (field === "state") {
    return job?.state || (job?.is_closed ? "closed" : "open")
  }

  return comparable(job?.[field])
}

function formValue(form, field) {
  if (field === "required_skills") {
    return arrayValue(form?.required_skills_text)
  }

  if (field === "preferred_skills") {
    return arrayValue(form?.preferred_skills_text)
  }

  if (["employment_type_id", "work_mode_id", "years_experience_required"].includes(field)) {
    return form?.[field] === "" ? null : Number(form?.[field])
  }

  return comparable(form?.[field])
}

export function isImportedJob(job) {
  return Boolean(job?.source_job_record_id || job?.source === "import")
}

export function safeExternalJobUrl(value) {
  try {
    const url = new URL(String(value || ""))

    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export function importFieldState(provenance, field) {
  if (!provenance?.imported) {
    return "none"
  }

  if (provenance.manual_overrides?.[field]) {
    return "manual"
  }

  return IMPORT_MANAGED_OWNERSHIP.has(provenance.field_ownership?.[field]) ? "source" : "none"
}

export function changedImportManagedFields(job, form, provenance) {
  if (!job || !provenance?.imported) {
    return []
  }

  return Object.entries(provenance.field_ownership || {})
    .filter(
      ([field, ownership]) =>
        EDITABLE_IMPORT_FIELDS.has(field) &&
        IMPORT_MANAGED_OWNERSHIP.has(ownership) &&
        !provenance.manual_overrides?.[field],
    )
    .map(([field]) => field)
    .filter((field) => {
      const before = originalValue(job, field)

      const after = formValue(form, field)

      if (Array.isArray(before) || Array.isArray(after)) {
        return JSON.stringify(arrayValue(before)) !== JSON.stringify(arrayValue(after))
      }

      return JSON.stringify(before) !== JSON.stringify(after)
    })
}
