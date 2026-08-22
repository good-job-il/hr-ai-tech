import { useState } from "react"

export function SearchBar({ placeholder = "חיפוש...", onSearch, className }) {
  const [value, setValue] = useState("")

  const handleClear = () => {
    setValue("")
    onSearch?.("")
  }

  return (
    <div className="relative w-full">
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />

      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onSearch?.(e.target.value)
        }}
        placeholder={placeholder}
        className={`w-full h-12 rounded-2xl border border-[#E4ECFF] bg-white px-4 pr-12 outline-none placeholder:text-[#CBD5E1] focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 ${className}`}
      />

      {value && (
        <button
          onClick={handleClear}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default SearchBar
import { Search, X } from "lucide-react"
