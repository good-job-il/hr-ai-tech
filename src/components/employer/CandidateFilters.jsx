import { useState } from "react"

export default function CandidateFilters({ isOpen, onClose, filters, onFilterChange }) {
  const [expanded, setExpanded] = useState({})

  const filterSections = [
    {
      id: "jobType",
      label: "סוג משרה",
      options: [
        { value: "full", label: "משרה מלאה" },
        { value: "part", label: "חלקית" },
        { value: "remote", label: "מרחוק" },
      ],
    },
    {
      id: "experience",
      label: "ניסיון",
      options: [
        { value: "0", label: "בלי ניסיון" },
        { value: "1-3", label: "1-3 שנים" },
        { value: "3-5", label: "3-5 שנים" },
        { value: "5+", label: "5+ שנים" },
      ],
    },
    {
      id: "education",
      label: "השכלה",
      options: [
        { value: "high", label: "תיכוני" },
        { value: "bachelor", label: "תואר ראשון" },
        { value: "master", label: "תואר שני" },
      ],
    },
    {
      id: "salaryRange",
      label: "טווח שכר",
      options: [
        { value: "0-15000", label: "עד 15K" },
        { value: "15000-25000", label: "15K - 25K" },
        { value: "25000-40000", label: "25K - 40K" },
        { value: "40000+", label: "40K+" },
      ],
    },
  ]

  const handleCheck = (section, value) => {
    const current = filters[section] || []

    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]

    onFilterChange({ ...filters, [section]: updated })
  }

  const handleReset = () => {
    onFilterChange({})
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 shadow-xl overflow-y-auto"
        dir="rtl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">סינון</h2>

          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {filterSections.map((section) => (
            <div key={section.id} className="border border-gray-100 rounded-lg">
              <button
                onClick={() => setExpanded((e) => ({ ...e, [section.id]: !e[section.id] }))}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 font-medium text-sm text-gray-900"
              >
                {section.label}

                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${expanded[section.id] ? "rotate-180" : ""}`}
                />
              </button>

              {expanded[section.id] && (
                <div className="border-t border-gray-100 p-3 space-y-2 bg-gray-50">
                  {section.options.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={(filters[section.id] || []).includes(opt.value)}
                        onChange={() => handleCheck(section.id, opt.value)}
                        className="w-4 h-4 text-hhblue rounded"
                      />

                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
          <Button
            onClick={onClose}
            className="w-full bg-hhblue hover:bg-hhblue/90 text-white font-semibold h-11"
          >
            החל סינון
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 font-semibold h-11"
          >
            אפס
          </Button>
        </div>
      </div>
    </>
  )
}
import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
