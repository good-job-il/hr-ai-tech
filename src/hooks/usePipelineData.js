import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { applicationService } from "@/api/services/applicationService"
import { APPLICATION_PIPELINE_STAGES } from "@/domain/agency/contracts"
import {
  filterAgencyRecordsByScope,
  getAgencyScopeFilter,
  isAgencyUser,
} from "@/domain/agency/access"
import { canRecruiterTransition } from "@/domain/agency/recruiterWorkspace"

function getDefaultStages(t) {
  return APPLICATION_PIPELINE_STAGES.map((stage) => ({
    ...stage,
    label: t(`pipeline.stages.${stage.id}`),
  }))
}

export function usePipelineData(user, filters = {}, onNotificationCreated) {
  const { t, i18n } = useTranslation()

  const [applications, setApplications] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)

  const [isMockData, setIsMockData] = useState(false)

  const appsSnapshot = useRef([])

  const stages = useMemo(() => getDefaultStages(t), [t, i18n.language])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const scopeFilter = getAgencyScopeFilter(user)

      const apps = await applicationService.list({
        ...scopeFilter,
        sort: "created_date",
        order: "DESC",
        limit: 500,
      })

      setIsMockData(false)

      const filtered = applyFilters(apps, filters, user)

      setApplications(filtered)
      appsSnapshot.current = filtered
    } catch (requestError) {
      setIsMockData(false)
      setApplications([])
      appsSnapshot.current = []
      setError({
        status: requestError?.status || requestError?.response?.status || null,
        message: requestError?.message || "Unable to load pipeline",
      })
    } finally {
      setLoading(false)
    }
  }, [filters, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const moveApplication = useCallback(
    async (appId, newStage) => {
      let oldStage = null

      let application = null

      const currentApplication = applications.find((a) => a.id === appId)

      if (
        user?.role === "recruiter" &&
        currentApplication &&
        !canRecruiterTransition(currentApplication.status, newStage)
      ) {
        setError({ status: 403, message: "This pipeline transition is not available to Recruiter" })

        return
      }

      const reopenReason =
        currentApplication?.status === "rejected" && newStage !== "rejected"
          ? window.prompt(
              t("pipeline.reopenReason", {
                defaultValue: "Reason for reopening this rejected application",
              }),
            )
          : null

      if (
        currentApplication?.status === "rejected" &&
        newStage !== "rejected" &&
        !reopenReason?.trim()
      ) {
        return
      }

      setApplications((prev) => {
        application = prev.find((a) => a.id === appId)
        oldStage = application?.status

        const next = prev.map((a) =>
          a.id === appId
            ? { ...a, status: newStage, stage_entered_at: new Date().toISOString() }
            : a,
        )

        appsSnapshot.current = next

        return next
      })

      if (String(appId).startsWith("demo-")) {
        return
      }

      try {
        if (oldStage === "rejected") {
          await applicationService.reopen(appId, newStage, reopenReason.trim())
        } else {
          await applicationService.updateStatus(appId, newStage)
        }

        if (application && oldStage && oldStage !== newStage && onNotificationCreated) {
          onNotificationCreated()
        }
      } catch (requestError) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: oldStage || a.status } : a)),
        )
        setError({
          status: requestError?.status || requestError?.response?.status || null,
          message: requestError?.message || "Unable to update application",
        })
      }
    },
    [applications, onNotificationCreated, t, user?.role],
  )

  return {
    stages,
    applications,
    loading,
    error,
    isMockData,
    moveApplication,
    refresh: loadData,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILITY POLICY — single source of truth for pipeline data access
//
//  org_admin / recruitment_manager → organization scope
//  team_manager → records with canonical team_id === user.team_id
//  employer   → ONLY applications where employer_id === user.email
//  recruiter  → assigned_to/recruiter_id === user.id
// ─────────────────────────────────────────────────────────────────────────────
function applyFilters(apps, filters, user) {
  let result = [...apps]

  if (isAgencyUser(user)) {
    result = filterAgencyRecordsByScope(user, result)
  } else if (user?.role === "employer") {
    result = result.filter((a) => a.employer_id === user.email)
  }

  if (filters.role) {
    result = result.filter((a) => a.job_title?.toLowerCase().includes(filters.role.toLowerCase()))
  }

  if (filters.recruiter) {
    result = result.filter((a) => a.recruiter?.includes(filters.recruiter))
  }

  if (filters.source) {
    result = result.filter((a) => a.source === filters.source)
  }

  if (filters.aiMin) {
    result = result.filter((a) => (a.match_score || 0) >= filters.aiMin)
  }

  if (filters.expMin != null && filters.expMin !== "") {
    result = result.filter((a) => (a.experience_years || 0) >= Number(filters.expMin))
  }

  if (filters.expMax != null && filters.expMax !== "") {
    result = result.filter((a) => (a.experience_years || 0) <= Number(filters.expMax))
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime()

    result = result.filter((a) => new Date(a.created_date).getTime() >= from)
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo)

    to.setHours(23, 59, 59, 999)
    result = result.filter((a) => new Date(a.created_date).getTime() <= to.getTime())
  }

  return result
}
