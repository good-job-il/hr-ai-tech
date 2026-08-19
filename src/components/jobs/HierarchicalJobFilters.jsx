import { useState, useMemo, useEffect } from "react"
import { taxonomyService } from "@/api/services/taxonomyService"
import { useQuery } from "@tanstack/react-query"

export default function HierarchicalJobFilters({ onFiltersChange, enabled = true }) {
  const [selectedDomains, setSelectedDomains] = useState([])

  const [selectedRoles, setSelectedRoles] = useState([])

  const [selectedSpecializations, setSelectedSpecializations] = useState([])

  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState([])

  const [selectedWorkModes, setSelectedWorkModes] = useState([])

  const [selectedLevels, setSelectedLevels] = useState([])

  const [searchDomain, setSearchDomain] = useState("")

  const [searchRole, setSearchRole] = useState("")

  const [searchSpec, setSearchSpec] = useState("")

  const [expandedSections, setExpandedSections] = useState({})

  // Fetch data
  const { data: domains = [] } = useQuery({
    queryKey: ["domains"],
    queryFn: () => taxonomyService.domains(),
    enabled,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => taxonomyService.roles(),
    enabled,
  })

  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations"],
    queryFn: () => taxonomyService.specializations(),
    enabled,
  })

  const { data: employmentTypes = [] } = useQuery({
    queryKey: ["employment-types"],
    queryFn: () => taxonomyService.employmentTypes(),
    enabled,
  })

  const { data: workModes = [] } = useQuery({
    queryKey: ["work-modes"],
    queryFn: () => taxonomyService.workModes(),
    enabled,
  })

  const { data: levels = [] } = useQuery({
    queryKey: ["experience-levels"],
    queryFn: () => taxonomyService.experienceLevels(),
    enabled,
  })

  // Filtered roles based on selected domains
  const filteredRoles = useMemo(() => {
    if (selectedDomains.length === 0) {
      return roles
    }

    return roles.filter((r) => selectedDomains.includes(r.domain_id))
  }, [roles, selectedDomains])

  // Filtered specializations based on selected roles
  const filteredSpecializations = useMemo(() => {
    if (selectedRoles.length === 0) {
      return specializations
    }

    const selectedRoleNames = roles
      .filter((r) => selectedRoles.includes(r.role_id))
      .map((r) => r.name)

    return specializations.filter((s) => selectedRoleNames.includes(s.role_name))
  }, [specializations, selectedRoles, roles])

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange({
      domains: selectedDomains,
      roles: selectedRoles,
      specializations: selectedSpecializations,
      employmentTypes: selectedEmploymentTypes,
      workModes: selectedWorkModes,
      levels: selectedLevels,
    })
  }, [
    selectedDomains,
    selectedRoles,
    selectedSpecializations,
    selectedEmploymentTypes,
    selectedWorkModes,
    selectedLevels,
    onFiltersChange,
  ])

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const FilterSection = ({
    title,
    items,
    selected,
    setSelected,
    searchValue,
    setSearchValue,
    itemKey = "id",
  }) => {
    const isExpanded = expandedSections[title] ?? true

    const filteredItems = items.filter((item) => {
      const text = item.name || item

      return text.toLowerCase().includes(searchValue.toLowerCase())
    })

    return (
      <div className="border-b border-gray-200 py-4">
        <button
          onClick={() => toggleSection(title)}
          className="w-full flex items-center justify-between font-semibold text-gray-800 hover:text-gray-900 transition-colors"
        >
          <span>{title}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {items.length > 8 && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`חפש ${title}...`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400/30 outline-none"
                  dir="rtl"
                />
              </div>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {filteredItems.map((item) => {
                const id = item[itemKey] || item.id

                const name = item.name || item

                const isSelected = selected.includes(id)

                return (
                  <label
                    key={id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected([...selected, id])
                        } else {
                          setSelected(selected.filter((s) => s !== id))
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">פילטרים</h2>
        {selectedDomains.length +
          selectedRoles.length +
          selectedSpecializations.length +
          selectedEmploymentTypes.length +
          selectedWorkModes.length +
          selectedLevels.length >
          0 && (
          <button
            onClick={() => {
              setSelectedDomains([])
              setSelectedRoles([])
              setSelectedSpecializations([])
              setSelectedEmploymentTypes([])
              setSelectedWorkModes([])
              setSelectedLevels([])
            }}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" /> נקה הכל
          </button>
        )}
      </div>

      <div className="space-y-0">
        <FilterSection
          title="תחום"
          items={domains}
          selected={selectedDomains}
          setSelected={setSelectedDomains}
          searchValue={searchDomain}
          setSearchValue={setSearchDomain}
          itemKey="domain_id"
        />

        <FilterSection
          title="תפקיד"
          items={filteredRoles}
          selected={selectedRoles}
          setSelected={setSelectedRoles}
          searchValue={searchRole}
          setSearchValue={setSearchRole}
          itemKey="role_id"
        />

        {filteredSpecializations.length > 0 && (
          <FilterSection
            title="התמחות"
            items={filteredSpecializations}
            selected={selectedSpecializations}
            setSelected={setSelectedSpecializations}
            searchValue={searchSpec}
            setSearchValue={setSearchSpec}
            itemKey="specialization_id"
          />
        )}

        <FilterSection
          title="סוג העסקה"
          items={employmentTypes}
          selected={selectedEmploymentTypes}
          setSelected={setSelectedEmploymentTypes}
          searchValue=""
          setSearchValue={() => {}}
          itemKey="type_id"
        />

        <FilterSection
          title="אופן עבודה"
          items={workModes}
          selected={selectedWorkModes}
          setSelected={setSelectedWorkModes}
          searchValue=""
          setSearchValue={() => {}}
          itemKey="mode_id"
        />

        <FilterSection
          title="רמת ניסיון"
          items={levels}
          selected={selectedLevels}
          setSelected={setSelectedLevels}
          searchValue=""
          setSearchValue={() => {}}
          itemKey="level_id"
        />
      </div>
    </div>
  )
}
