const ranges = [
  { key: "today", label: "היום" },
  { key: "yesterday", label: "אתמול" },
  { key: "week", label: "השבוע" },
  { key: "month", label: "החודש" },
  { key: "quarter", label: "הרבעון" },
  { key: "year", label: "השנה" },
  { key: "custom", label: "מותאם אישית" },
]

export default function TimeRangeFilter({
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6" dir="rtl">
      <div className="flex items-center gap-1.5 text-gray-500 text-sm ml-1">
        <Calendar className="w-4 h-4" />

        <span className="font-medium">טווח זמן:</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              range === r.key
                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="flex items-center gap-2 mr-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 bg-white"
          />

          <span className="text-gray-400 text-sm">עד</span>

          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 bg-white"
          />
        </div>
      )}
    </div>
  )
}
