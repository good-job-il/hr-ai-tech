import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { taxonomyService } from "@/api/services/taxonomyService"
import { roleAliasService } from "@/api/services/permissionService"

export default function TaxonomyVerification() {
  const [expandedDomain, setExpandedDomain] = useState(null)

  const [loading, setLoading] = useState(false)

  const [loadResult, setLoadResult] = useState(null)

  // Fetch all data
  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: ["domains-verify"],
    queryFn: () => taxonomyService.domains(),
  })

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles-verify"],
    queryFn: () => taxonomyService.roles(),
  })

  const { data: specializations = [], isLoading: specsLoading } = useQuery({
    queryKey: ["specializations-verify"],
    queryFn: () => taxonomyService.specializations(),
  })

  const { data: aliases = [], isLoading: aliasesLoading } = useQuery({
    queryKey: ["aliases-verify"],
    queryFn: () => roleAliasService.list({ limit: 1000 }),
  })

  const isLoading = domainsLoading || rolesLoading || specsLoading || aliasesLoading

  // Calculate stats
  const stats = {
    domains: domains.length,
    roles: roles.length,
    specializations: specializations.length,
    aliases: aliases.length,
    rolesWithDomains: roles.filter((r) => r.domain_id).length,
    specsWithRoles: specializations.filter((s) => s.role_name).length,
  }

  // Get roles for a specific domain
  const getRolesForDomain = (domainId) => {
    return roles.filter((r) => r.domain_id === domainId)
  }

  // Get specs for a role
  const getSpecsForRole = (roleName) => {
    return specializations.filter((s) => s.role_name === roleName)
  }

  // Find canonical role for alias
  const getCanonicalRole = (alias) => {
    const record = aliases.find((a) => a.alias.toLowerCase() === alias.toLowerCase())

    return record?.canonical_role || null
  }

  const handleLoadTaxonomy = async () => {
    setLoading(true)
    setLoadResult(null)

    try {
      const snapshot = await taxonomyService.load()

      setLoadResult({
        success: true,
        message: "Taxonomy loaded from database",
        stats: {
          domains: snapshot.domains.length,
          roles: snapshot.roles.length,
          specializations: snapshot.specializations.length,
          employmentTypes: snapshot.employmentTypes.length,
          workModes: snapshot.workModes.length,
          experienceLevels: snapshot.experienceLevels.length,
        },
      })
    } catch (error) {
      setLoadResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  // Check for unmatched aliases
  const unmatchedAliases = aliases.filter((alias) => {
    const roleExists = roles.find((r) => r.name === alias.canonical_role)

    return !roleExists
  })

  // Check for roles without domain
  const rolesWithoutDomain = roles.filter((r) => !r.domain_id)

  // Check for specializations without matching role
  const unmatchedSpecializations = specializations.filter((spec) => {
    const roleExists = roles.find((r) => r.name === spec.role_name)

    return !roleExists
  })

  if (isLoading && !loadResult) {
    return (
      <AdminLayout>
        <div className="p-6 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">בדיקת Taxonomy</h1>
            <p className="text-sm text-gray-500 mt-1">אימות הנתונים שנטענו מהקובץ</p>
          </div>
          <button
            onClick={handleLoadTaxonomy}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "📥"}
            {loading ? "טוען..." : "טען Taxonomy"}
          </button>
        </div>

        {loadResult && (
          <div
            className={`rounded-2xl border p-4 mb-8 ${loadResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <div
              className={`text-sm font-semibold ${loadResult.success ? "text-green-800" : "text-red-800"}`}
            >
              {loadResult.success ? "✅ " : "❌ "} {loadResult.message}
            </div>
            {loadResult.stats && (
              <div className="text-xs text-gray-600 mt-2 space-y-1">
                {Object.entries(loadResult.stats).map(([key, val]) => (
                  <div key={key}>
                    {key}:{" "}
                    {typeof val === "object" ? `${val.created} חדשות מתוך ${val.total}` : val}
                  </div>
                ))}
              </div>
            )}
            {loadResult.errors && (
              <div className="text-xs text-red-700 mt-2 space-y-1">
                {loadResult.errors.map((e, i) => (
                  <div key={i}>⚠️ {e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "תחומים", value: stats.domains, icon: "📁" },
            { label: "תפקידים", value: stats.roles, icon: "👔" },
            { label: "התמחויות", value: stats.specializations, icon: "🎯" },
            { label: "Aliases", value: stats.aliases, icon: "🔗" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Health Checks */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">בדיקות תקינות</h2>
          <div className="space-y-2">
            {[
              {
                label: "תפקידים משויכים לתחום",
                pass: rolesWithoutDomain.length === 0,
                detail:
                  rolesWithoutDomain.length === 0
                    ? "✓ הכל בסדר"
                    : `❌ ${rolesWithoutDomain.length} חסרים`,
              },
              {
                label: "התמחויות משויכות לתפקיד",
                pass: unmatchedSpecializations.length === 0,
                detail:
                  unmatchedSpecializations.length === 0
                    ? "✓ הכל בסדר"
                    : `❌ ${unmatchedSpecializations.length} לא מחוברות`,
              },
              {
                label: "Aliases מחוברות לתפקיד קיים",
                pass: unmatchedAliases.length === 0,
                detail:
                  unmatchedAliases.length === 0
                    ? "✓ הכל בסדר"
                    : `❌ ${unmatchedAliases.length} בלתי מחוברות`,
              },
            ].map((check) => (
              <div key={check.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                {check.pass ? (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{check.label}</div>
                </div>
                <div
                  className={`text-sm font-semibold ${check.pass ? "text-green-600" : "text-red-600"}`}
                >
                  {check.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        {(rolesWithoutDomain.length > 0 ||
          unmatchedSpecializations.length > 0 ||
          unmatchedAliases.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-red-900 mb-4">שגיאות בנתונים</h2>
            {rolesWithoutDomain.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-800 mb-2">תפקידים ללא תחום:</h3>
                <div className="space-y-1 text-sm text-red-700">
                  {rolesWithoutDomain.map((r) => (
                    <div key={r.id}>• {r.name}</div>
                  ))}
                </div>
              </div>
            )}
            {unmatchedSpecializations.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-800 mb-2">התמחויות ללא תפקיד מתאים:</h3>
                <div className="space-y-1 text-sm text-red-700">
                  {unmatchedSpecializations.map((s) => (
                    <div key={s.id}>
                      • {s.name} → {s.role_name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {unmatchedAliases.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Aliases ללא תפקיד קיים:</h3>
                <div className="space-y-1 text-sm text-red-700">
                  {unmatchedAliases.map((a) => (
                    <div key={a.id}>
                      • {a.alias} → {a.canonical_role}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Domains with Roles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">תחומים ותפקידים</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {domains.map((domain) => {
              const domainRoles = getRolesForDomain(domain.domain_id)

              const isExpanded = expandedDomain === domain.id

              return (
                <div key={domain.id} className="p-4">
                  <button
                    onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-sm font-semibold text-gray-900`}>{domain.name}</div>
                      <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {domainRoles.length} תפקידים
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 ml-4 border-r-2 border-gray-200 pr-4 space-y-2">
                      {domainRoles.length === 0 ? (
                        <div className="text-xs text-gray-400 italic">אין תפקידים</div>
                      ) : (
                        domainRoles.map((role) => {
                          const roleSpecs = getSpecsForRole(role.name)

                          return (
                            <div key={role.id} className="text-sm">
                              <div className="font-medium text-gray-700">
                                {role.name}
                                {roleSpecs.length > 0 && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    ({roleSpecs.length} התמחויות)
                                  </span>
                                )}
                              </div>
                              {roleSpecs.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1 ml-2">
                                  {roleSpecs.map((s) => s.name).join(", ")}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Aliases */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Aliases ומיפוי לתפקידים</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {aliases.map((alias) => (
              <div key={alias.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{alias.alias}</div>
                  <div className="text-xs text-gray-500 mt-0.5">→ {alias.canonical_role}</div>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Test Search */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6 mt-8">
          <h2 className="text-lg font-bold text-blue-900 mb-4">בדיקת Alias Matching</h2>
          <div className="space-y-3">
            {["Fullstack Developer", "Backend Engineer", "SDR", "QA Engineer"].map((testAlias) => {
              const canonical = getCanonicalRole(testAlias)

              return (
                <div
                  key={testAlias}
                  className="bg-white rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">{testAlias}</div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${canonical ? "text-green-600" : "text-red-600"}`}
                  >
                    {canonical ? `✓ ${canonical}` : "✗ לא נמצא"}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
