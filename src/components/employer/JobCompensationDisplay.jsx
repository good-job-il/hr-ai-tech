import { useAuth } from "@/lib/AuthContext"

const COMPENSATION_CONFIG = {
  recruiter: { percent: 40, label: "רכז גיוס" },
  team_manager: { percent: 10, label: "מנהל צוות" },
  recruitment_manager: { percent: 5, label: "מנהל גיוס" },
}

const VISIBILITY = {
  admin: ["recruiter", "team_manager", "recruitment_manager"],
  recruitment_manager: ["recruiter", "team_manager", "recruitment_manager"],
  team_manager: ["recruiter", "team_manager"],
  recruiter: ["recruiter"],
  employer: ["recruiter", "team_manager", "recruitment_manager"],
}

export default function JobCompensationDisplay({ job, baseSalary = 0, onEdit }) {
  const { user } = useAuth()

  const userRole = user?.role || "employer"

  const visibleRoles = VISIBILITY[userRole] || []

  if (!baseSalary || baseSalary <= 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-purple-600" />
          <h4 className="text-sm font-bold text-gray-900">משכורת ותגמולים (80% משכר בסיס)</h4>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-purple-600" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visibleRoles.map((role) => {
          const config = COMPENSATION_CONFIG[role]

          const amount = (baseSalary * 0.8 * config.percent) / 100

          return (
            <div
              key={role}
              className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">{config.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold">
                  {config.percent}%
                </span>
                <span className="font-bold text-purple-700 text-sm">
                  {amount.toLocaleString()} ₪
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-600 pt-2 border-t border-purple-200">
        💡 תגמולים מחושבים ממשכר בסיס בסיום תקופת אחריות (30 ימים)
      </p>
    </div>
  )
}
