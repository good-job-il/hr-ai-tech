import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Star,
  Calendar,
  UserCheck,
  FileText,
  Edit2,
  Plus,
} from "lucide-react"
import ResumePreviewModal from "./ResumePreviewModal"
import AssignToJobModal from "./AssignToJobModal"
import { useTranslation } from "react-i18next"

export default function CandidateProfileHeader({
  candidate,
  tags,
  applications = [],
  onStatusChange,
  onEdit,
  onAssignSuccess,
}) {
  const { t } = useTranslation()

  const STATUS_COLORS = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    interview: "bg-purple-100 text-purple-700",
    offer: "bg-orange-100 text-orange-700",
    hired: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    inactive: "bg-gray-100 text-gray-500",
  }

  const STATUS_LABELS = {
    new: t("candidateCRM.profileHeader.statuses.new"),
    contacted: t("candidateCRM.profileHeader.statuses.contacted"),
    interview: t("candidateCRM.profileHeader.statuses.interview"),
    offer: t("candidateCRM.profileHeader.statuses.offer"),
    hired: t("candidateCRM.profileHeader.statuses.hired"),
    rejected: t("candidateCRM.profileHeader.statuses.rejected"),
    inactive: t("candidateCRM.profileHeader.statuses.inactive"),
  }

  const SOURCE_LABELS = {
    import: t("candidateCRM.profileHeader.sources.import"),
    manual: t("candidateCRM.profileHeader.sources.manual"),
    linkedin: t("candidateCRM.profileHeader.sources.linkedin"),
    upload: t("candidateCRM.profileHeader.sources.upload"),
    crawl: t("candidateCRM.profileHeader.sources.crawl"),
  }

  const [changingStatus, setChangingStatus] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  if (!candidate) return null

  const initials =
    candidate.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  const score = candidate.data_quality_score || candidate.parsing_confidence || 0

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center text-white text-2xl font-black">
            {initials}
          </div>
          {score >= 70 && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-[#0F172A]">{candidate.full_name}</h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[candidate.status] || "bg-gray-100 text-gray-600"}`}
            >
              {STATUS_LABELS[candidate.status] || candidate.status}
            </span>
            {candidate.review_required && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                {t("candidateCRM.profileHeader.reviewRequired")}
              </span>
            )}
          </div>

          <div className="text-base font-semibold text-[#64748B] mb-3">
            {candidate.role_name && <span>{candidate.role_name}</span>}
            {candidate.domain_name && <span> · {candidate.domain_name}</span>}
            {candidate.experience_years && (
              <span>
                {" "}
                · {candidate.experience_years} {t("candidateCRM.profileHeader.yearsExperience")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#64748B]">
            {candidate.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {candidate.location}
              </span>
            )}
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-1 hover:text-[#7C3AED] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="flex items-center gap-1 hover:text-[#7C3AED] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {candidate.phone}
              </a>
            )}
            {candidate.desired_salary_min && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />₪
                {candidate.desired_salary_min?.toLocaleString()}
                {candidate.desired_salary_max &&
                  `–${candidate.desired_salary_max?.toLocaleString()}`}
              </span>
            )}
          </div>

          {/* Tags */}
          {tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: t.color || "#7C3AED",
                    color: t.color || "#7C3AED",
                    background: `${t.color || "#7C3AED"}15`,
                  }}
                >
                  {t.tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          {/* AI Score */}
          <div className="bg-[#F7F8FC] rounded-xl p-3 text-center min-w-[80px]">
            <div
              className={`text-2xl font-black ${score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-gray-400"}`}
            >
              {score}%
            </div>
            <div className="text-xs text-[#94A3B8] font-semibold">
              {t("candidateCRM.profileHeader.aiScore")}
            </div>
          </div>

          {/* Source + Date */}
          <div className="text-right">
            <div className="text-xs text-[#94A3B8]">
              {t("candidateCRM.profileHeader.source")}:{" "}
              <span className="font-semibold text-[#64748B]">
                {SOURCE_LABELS[candidate.source] || candidate.source || "—"}
              </span>
            </div>
            {candidate.created_date && (
              <div className="text-xs text-[#94A3B8] flex items-center justify-end gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(candidate.created_date).toLocaleDateString("he-IL")}
              </div>
            )}
            {candidate.recruiter_id && (
              <div className="text-xs text-[#94A3B8] flex items-center justify-end gap-1 mt-0.5">
                <UserCheck className="w-3 h-3" />
                <span className="text-[#7C3AED] font-semibold">{candidate.recruiter_id}</span>
              </div>
            )}
          </div>

          {/* Job assignment indicator */}
          <div className="mt-1">
            {applications.length > 0 ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                {t("candidateCRM.profileHeader.assignedTo", { count: applications.length })}
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#94A3B8]">
                {t("candidateCRM.profileHeader.notAssigned")}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1 flex-wrap">
            <Button
              size="sm"
              onClick={() => setShowAssignModal(true)}
              className="text-xs gap-1 bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white border-0"
            >
              <Plus className="w-3.5 h-3.5" /> {t("candidateCRM.profileHeader.assignToJob")}
            </Button>
            {(candidate.resume_url || candidate.summary || candidate.skills?.length > 0) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowResume(true)}
                className="text-xs gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> {t("candidateCRM.profileHeader.resume")}
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit} className="text-xs gap-1">
                <Edit2 className="w-3.5 h-3.5" /> {t("candidateCRM.profileHeader.edit")}
              </Button>
            )}
          </div>

          {showResume && (
            <ResumePreviewModal candidate={candidate} onClose={() => setShowResume(false)} />
          )}
          {showAssignModal && (
            <AssignToJobModal
              candidate={candidate}
              onClose={() => setShowAssignModal(false)}
              onAssignSuccess={(appId) => {
                setShowAssignModal(false)
                if (onAssignSuccess) onAssignSuccess(appId)
              }}
            />
          )}
        </div>
      </div>

      {/* Skills */}
      {candidate.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[#F0F1F5]">
          {candidate.skills.slice(0, 12).map((skill, i) => (
            <span
              key={i}
              className="text-xs bg-[#EEF4FF] text-[#4F46E5] font-semibold px-2.5 py-1 rounded-lg"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 12 && (
            <span className="text-xs text-[#94A3B8] font-semibold px-2 py-1">
              +{candidate.skills.length - 12} {t("candidateCRM.profileHeader.more")}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
