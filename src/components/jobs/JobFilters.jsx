import { useState } from "react"

const CATEGORIES = [
  "פיתוח תוכנה",
  "עיצוב",
  "שיווק",
  "מכירות",
  "כספים",
  "HR",
  "הנדסה",
  "רפואה",
  "חינוך",
  "לוגיסטיקה",
]

export default function JobFilters({ isOpen, onClose, filters, onFilterChange, onSearch }) {
  const [expanded, setExpanded] = useState({})

  const [tempFilters, setTempFilters] = useState(filters)

  const filterSections = [
    {
      id: "type",
      label: "סוג משרה",
      options: [
        { value: "full", label: "משרה מלאה" },
        { value: "part", label: "חלקית" },
        { value: "remote", label: "מרחוק" },
        { value: "daily", label: "יום" },
      ],
    },
    {
      id: "category",
      label: "קטגוריה",
      options: CATEGORIES.map((cat) => ({ value: cat, label: cat })),
    },
    {
      id: "salary_range",
      label: "טווח שכר",
      options: [
        { value: "0-15000", label: "עד ₪15,000" },
        { value: "15000-25000", label: "₪15,000 - ₪25,000" },
        { value: "25000-40000", label: "₪25,000 - ₪40,000" },
        { value: "40000+", label: "מעל ₪40,000" },
      ],
    },
  ]

  const handleCheck = (section, value) => {
    const current = tempFilters[section] || []

    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]

    setTempFilters({ ...tempFilters, [section]: updated })
  }

  const handleLocationChange = (e) => {
    setTempFilters({ ...tempFilters, location: e.target.value })
  }

  const handleSalaryMinChange = (e) => {
    setTempFilters({ ...tempFilters, salary_min: e.target.value ? parseInt(e.target.value) : "" })
  }

  const handleSalaryMaxChange = (e) => {
    setTempFilters({ ...tempFilters, salary_max: e.target.value ? parseInt(e.target.value) : "" })
  }

  const handleApply = () => {
    onFilterChange(tempFilters)
    onSearch?.()
    onClose()
  }

  const handleReset = () => {
    setTempFilters({})
    onFilterChange({})
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer - adjusted for RTL */}
      <div
        className="fixed left-0 top-0 bottom-0 w-full sm:w-96 bg-gradient-to-b from-[#1a1f3a] to-[#0f1629] z-50 shadow-2xl overflow-y-auto border-l border-white/10"
        dir="rtl"
      >
        <div className="sticky top-0 bg-gradient-to-b from-[#1a1f3a] to-[#0f1629] border-b border-white/10 px-6 py-5 flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">סינון משרות</h2>

          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-lg transition-colors active:scale-90 -mr-2"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Location */}
          <div className="border border-white/15 rounded-2xl p-5 bg-white/5 hover:border-white/25 transition-colors">
            <label className="text-base font-semibold text-cyan-300 block mb-4">🏙️ מיקום</label>

            <input
              type="text"
              value={tempFilters.location || ""}
              onChange={handleLocationChange}
              placeholder="הזן עיר או אזור..."
              className="w-full border border-white/20 rounded-xl px-5 py-3.5 text-base bg-white/10 text-white outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 placeholder:text-gray-500 transition-all"
              style={{ color: "#ffffff" }}
            />
          </div>

          {/* Salary Range */}
          <div className="border border-white/15 rounded-2xl p-5 bg-white/5 hover:border-white/25 transition-colors">
            <label className="text-base font-semibold text-cyan-300 block mb-4">💰 טווח שכר</label>

            <div className="space-y-3">
              <input
                type="number"
                value={tempFilters.salary_min || ""}
                onChange={handleSalaryMinChange}
                placeholder="שכר מינימום..."
                className="w-full border border-white/20 rounded-xl px-5 py-3.5 text-base bg-white/10 text-white outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 placeholder:text-gray-500 transition-all"
                style={{ color: "#ffffff" }}
              />

              <input
                type="number"
                value={tempFilters.salary_max || ""}
                onChange={handleSalaryMaxChange}
                placeholder="שכר מקסימום..."
                className="w-full border border-white/20 rounded-xl px-5 py-3.5 text-base bg-white/10 text-white outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 placeholder:text-gray-500 transition-all"
                style={{ color: "#ffffff" }}
              />
            </div>
          </div>

          {/* Other filters */}
          {filterSections.map((section) => (
            <div
              key={section.id}
              className="border border-white/15 rounded-2xl bg-white/5 hover:border-white/25 transition-colors overflow-hidden"
            >
              <button
                onClick={() => setExpanded((e) => ({ ...e, [section.id]: !e[section.id] }))}
                className="w-full flex items-center justify-between p-5 hover:bg-white/10 font-semibold text-base text-white transition-all active:bg-white/15"
              >
                {section.label}

                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${expanded[section.id] ? "rotate-180" : ""}`}
                />
              </button>

              {expanded[section.id] && (
                <div className="border-t border-white/10 p-5 space-y-4 bg-white/5">
                  {section.options.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 cursor-pointer hover:bg-white/10 p-2.5 rounded-lg transition-all active:bg-white/15 -mx-2.5 px-3.5"
                    >
                      <input
                        type="checkbox"
                        checked={(tempFilters[section.id] || []).includes(opt.value)}
                        onChange={() => handleCheck(section.id, opt.value)}
                        className="w-5 h-5 rounded accent-purple-600 cursor-pointer"
                      />

                      <span className="text-base text-gray-300 font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-[#1a1f3a] to-[#0f1629] border-t border-white/10 px-6 py-5 space-y-3">
          <Button
            onClick={handleApply}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold h-12 rounded-xl text-base shadow-lg hover:shadow-xl transition-all active:scale-95 touch-highlight-transparent"
          >
            חיפוש משרות
          </Button>

          <Button
            onClick={handleReset}
            className="w-full border border-white/20 text-gray-300 font-semibold h-12 rounded-xl text-base hover:bg-white/10 transition-all active:scale-95 touch-highlight-transparent"
          >
            אפס סינון
          </Button>
        </div>
      </div>
    </>
  )
}
