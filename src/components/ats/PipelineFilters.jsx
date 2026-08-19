import { useState } from "react"
import { useTranslation } from "react-i18next"

const SOURCES = ["linkedin", "app", "jobsite", "import", "facebook"]

const DEFAULT_FILTERS = {
  role: "",
  recruiter: "",
  aiMin: 0,
  source: "",
  dateFrom: "",
  dateTo: "",
  expMin: "",
  expMax: "",
}

export default function PipelineFilters({ filters, onChange }) {
  const { t, i18n } = useTranslation()

  const [showAdvanced, setShowAdvanced] = useState(false)

  const isRTL = !i18n.language?.startsWith("en")

  const update = (key, value) => onChange({ ...filters, [key]: value })

  const reset = () => onChange(DEFAULT_FILTERS)

  const hasBasic = filters.role || filters.source || filters.aiMin

  const hasAdvanced =
    filters.dateFrom || filters.dateTo || filters.expMin || filters.expMax || filters.recruiter

  const hasActive = hasBasic || hasAdvanced

  return (
    <div className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#E4ECFF] bg-white">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder={t("pipeline.filters.searchByRole")}
            value={filters.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-40 outline-none text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
          />
        </div>

        <select
          value={filters.source}
          onChange={(e) => update("source", e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#E4ECFF] bg-white text-sm font-semibold text-[#64748B] outline-none"
        >
          <option value="">{t("pipeline.filters.allSources")}</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`pipeline.sources.${s}`)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#E4ECFF] bg-white">
          <span className="text-xs font-bold text-[#64748B]">{t("pipeline.filters.aiMin")}</span>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.aiMin || ""}
            onChange={(e) => update("aiMin", Number(e.target.value))}
            placeholder="0"
            className="w-12 outline-none text-sm font-bold text-[#0F172A] bg-transparent"
          />
          <span className="text-xs text-[#94A3B8]">%</span>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`h-10 px-4 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all ${
            showAdvanced || hasAdvanced
              ? "bg-[#F3EFFF] border-[#C4B5FD] text-[#7C3AED]"
              : "bg-white border-[#E4ECFF] text-[#64748B] hover:border-[#C4B5FD]"
          }`}
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {t("pipeline.filters.advancedFilter")}
          {hasAdvanced && <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />}
        </button>

        {hasActive && (
          <button
            onClick={reset}
            className="h-10 px-4 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all"
          >
            <X className="w-4 h-4" />
            {t("pipeline.filters.clearAll")}
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-[#F7FBFF] rounded-xl border border-[#E4ECFF]">
          <div className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#E4ECFF] bg-white">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={t("pipeline.filters.recruiterName")}
              value={filters.recruiter || ""}
              onChange={(e) => update("recruiter", e.target.value)}
              className="w-32 outline-none text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748B]">
              {t("pipeline.filters.fromDate")}
            </span>
            <input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => update("dateFrom", e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E4ECFF] bg-white text-sm text-[#0F172A] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748B]">{t("pipeline.filters.toDate")}</span>
            <input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => update("dateTo", e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E4ECFF] bg-white text-sm text-[#0F172A] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#E4ECFF] bg-white">
            <span className="text-xs font-bold text-[#64748B]">
              {t("pipeline.filters.experienceYears")}
            </span>
            <input
              type="number"
              min={0}
              max={30}
              value={filters.expMin || ""}
              onChange={(e) => update("expMin", e.target.value)}
              placeholder={t("pipeline.filters.from")}
              className="w-10 outline-none text-sm font-bold text-[#0F172A] bg-transparent text-center"
            />
            <span className="text-xs text-[#94A3B8]">—</span>
            <input
              type="number"
              min={0}
              max={30}
              value={filters.expMax || ""}
              onChange={(e) => update("expMax", e.target.value)}
              placeholder={t("pipeline.filters.to")}
              className="w-10 outline-none text-sm font-bold text-[#0F172A] bg-transparent text-center"
            />
          </div>
        </div>
      )}
    </div>
  )
}
