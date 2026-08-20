import { useState } from "react"
import { MapPin, Phone, Star, Video } from "lucide-react"
import { he, enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"

const TYPE_ICONS = {
  phone: Phone,
  video: Video,
  in_person: MapPin,
  technical: Star,
  hr: Star,
  final: Star,
}

const EMPTY_FORM = {
  application_id: "",
  date: "",
  time: "",
  type: "video",
  stage: "first",
  location_or_link: "",
  job_title: "",
  interviewer_name: "",
  interviewer_email: "",
  notes: "",
  duration_minutes: 45,
}

export default function InterviewsPanel({
  interviews,
  applications = [],
  canCreate = true,
  canUpdate = true,
  onSchedule,
  onUpdate,
}) {
  const { t, i18n } = useTranslation()

  const currentLang = i18n.language?.startsWith("en") ? "en" : "he"

  const dateLocale = currentLang === "he" ? he : enUS

  const TYPE_LABELS = {
    phone: t("candidateCRM.interviews.types.phone"),
    video: t("candidateCRM.interviews.types.video"),
    in_person: t("candidateCRM.interviews.types.in_person"),
    technical: t("candidateCRM.interviews.types.technical"),
    hr: t("candidateCRM.interviews.types.hr"),
    final: t("candidateCRM.interviews.types.final"),
  }

  const STAGE_LABELS = {
    screening: t("candidateCRM.interviews.stages.screening"),
    first: t("candidateCRM.interviews.stages.first"),
    second: t("candidateCRM.interviews.stages.second"),
    third: t("candidateCRM.interviews.stages.third"),
    technical: t("candidateCRM.interviews.stages.technical"),
    hr: t("candidateCRM.interviews.stages.hr"),
    final: t("candidateCRM.interviews.stages.final"),
    offer: t("candidateCRM.interviews.stages.offer"),
  }

  const STATUS_CFG = {
    scheduled: {
      label: t("candidateCRM.interviews.statuses.scheduled"),
      color: "bg-blue-100 text-blue-700",
    },
    confirmed: {
      label: t("candidateCRM.interviews.statuses.confirmed"),
      color: "bg-green-100 text-green-700",
    },
    completed: {
      label: t("candidateCRM.interviews.statuses.completed"),
      color: "bg-gray-100 text-gray-600",
    },
    cancelled: {
      label: t("candidateCRM.interviews.statuses.cancelled"),
      color: "bg-red-100 text-red-700",
    },
    no_show: {
      label: t("candidateCRM.interviews.statuses.no_show"),
      color: "bg-orange-100 text-orange-700",
    },
    rescheduled: {
      label: t("candidateCRM.interviews.statuses.rescheduled"),
      color: "bg-yellow-100 text-yellow-700",
    },
  }

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)

  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.application_id || !form.date || !form.time) {
      return
    }

    setSaving(true)

    try {
      await onSchedule({
        ...form,
        application_id: Number(form.application_id),
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const upcoming = interviews.filter((i) => ["scheduled", "confirmed"].includes(i.status))

  const past = interviews.filter((i) => ["completed", "cancelled", "no_show"].includes(i.status))

  return (
    <div>
      {!showForm && canCreate && applications.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#E4ECFF] text-[#94A3B8] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all text-sm font-semibold mb-4"
        >
          <Plus className="w-4 h-4" /> {t("candidateCRM.interviews.schedule")}
        </button>
      )}

      {showForm && (
        <div className="bg-[#F7F8FC] rounded-xl p-4 mb-4 border border-[#E4ECFF]">
          <h4 className="font-black text-[#0F172A] mb-3 text-sm">
            {t("candidateCRM.interviews.scheduleNew")}
          </h4>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.tabs.applications")} *
              </label>

              <select
                value={form.application_id}
                onChange={(event) => {
                  const application = applications.find(
                    (item) => item.id === Number(event.target.value),
                  )

                  setForm((previous) => ({
                    ...previous,
                    application_id: event.target.value,
                    job_title: application?.job_title || previous.job_title,
                  }))
                }}
                className="w-full rounded-lg border border-[#E4ECFF] bg-white px-3 py-2 text-sm text-[#1F2937]"
              >
                <option value="">—</option>

                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.job_title || `#${application.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.interviews.form.date")} *
              </label>

              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.interviews.form.time")} *
              </label>

              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.interviews.form.type")}
              </label>

              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full text-sm border border-[#E4ECFF] rounded-lg px-3 py-2 bg-white text-[#1F2937]"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.interviews.form.stage")}
              </label>

              <select
                value={form.stage}
                onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}
                className="w-full text-sm border border-[#E4ECFF] rounded-lg px-3 py-2 bg-white text-[#1F2937]"
              >
                {Object.entries(STAGE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.interviews.form.locationLink")}
              </label>

              <Input
                value={form.location_or_link}
                onChange={(e) => setForm((p) => ({ ...p, location_or_link: e.target.value }))}
                placeholder={t("candidateCRM.interviews.form.locationPlaceholder")}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.interviews.form.interviewer")}
              </label>

              <Input
                value={form.interviewer_name}
                onChange={(e) => setForm((p) => ({ ...p, interviewer_name: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#64748B] mb-1 block">
                {t("candidateCRM.interviews.form.job")}
              </label>

              <Input
                value={form.job_title}
                onChange={(e) => setForm((p) => ({ ...p, job_title: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!form.application_id || !form.date || !form.time || saving}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs"
            >
              {saving
                ? t("candidateCRM.interviews.saving")
                : t("candidateCRM.interviews.scheduleInterview")}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="text-xs"
            >
              {t("candidateCRM.interviews.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">
            {t("candidateCRM.interviews.upcoming")}
          </div>

          <div className="space-y-2">
            {upcoming.map((i) => (
              <InterviewCard
                key={i.id}
                interview={i}
                onUpdate={onUpdate}
                canUpdate={canUpdate}
                typeLabels={TYPE_LABELS}
                stageLabels={STAGE_LABELS}
                statusCfg={STATUS_CFG}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">
            {t("candidateCRM.interviews.past")}
          </div>

          <div className="space-y-2">
            {past.map((i) => (
              <InterviewCard
                key={i.id}
                interview={i}
                onUpdate={onUpdate}
                canUpdate={canUpdate}
                typeLabels={TYPE_LABELS}
                stageLabels={STAGE_LABELS}
                statusCfg={STATUS_CFG}
              />
            ))}
          </div>
        </div>
      )}

      {interviews.length === 0 && (
        <div className="text-center py-8 text-[#94A3B8]">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />

          <p className="text-sm font-semibold">{t("candidateCRM.interviews.noInterviews")}</p>
        </div>
      )}
    </div>
  )
}

function InterviewCard({ interview, onUpdate, canUpdate, typeLabels, stageLabels, statusCfg }) {
  const { t } = useTranslation()

  const [showFeedback, setShowFeedback] = useState(false)

  const [feedback, setFeedback] = useState(interview.feedback || "")

  const [rating, setRating] = useState(interview.rating || 0)

  const TypeIcon = TYPE_ICONS[interview.type] || Video

  const status = statusCfg[interview.status] || statusCfg.scheduled

  const saveFeedback = async () => {
    await onUpdate?.(interview.id, { feedback, rating, status: "completed" })
    setShowFeedback(false)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E4ECFF] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-4 h-4 text-[#7C3AED]" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-[#0F172A]">
                {typeLabels[interview.type]} — {stageLabels[interview.stage]}
              </span>

              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-[#64748B] flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />

                {interview.date}
              </span>

              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />

                {interview.time}
              </span>

              {interview.job_title && (
                <span className="text-[#7C3AED] font-semibold">{interview.job_title}</span>
              )}
            </div>
          </div>
        </div>

        {canUpdate && interview.status === "scheduled" && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFeedback(true)}
              className="text-xs h-7"
            >
              {t("candidateCRM.interviews.feedback")}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate?.(interview.id, { status: "cancelled" })}
              className="text-xs h-7 text-red-500 hover:text-red-600"
            >
              {t("candidateCRM.interviews.cancelInterview")}
            </Button>
          </div>
        )}
      </div>

      {interview.rating > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${s <= interview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
            />
          ))}
        </div>
      )}

      {interview.feedback && (
        <p className="text-xs text-[#64748B] mt-2 bg-[#F7F8FC] rounded-lg px-3 py-2">
          {interview.feedback}
        </p>
      )}

      {showFeedback && (
        <div className="mt-3 border-t border-[#F0F1F5] pt-3">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star
                  className={`w-5 h-5 transition-colors ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t("candidateCRM.interviews.feedbackPlaceholder")}
            className="w-full text-sm border border-[#E4ECFF] rounded-lg px-3 py-2 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
          />

          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={saveFeedback} className="bg-[#7C3AED] text-white text-xs">
              {t("candidateCRM.interviews.saveFeedback")}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFeedback(false)}
              className="text-xs"
            >
              {t("candidateCRM.interviews.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
