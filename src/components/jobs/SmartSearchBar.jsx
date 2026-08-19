import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function SmartSearchBar() {
  const [query, setQuery] = useState("")

  const navigate = useNavigate()

  const handleSearch = () => {
    if (!query.trim()) {
      return
    }

    navigate(`/jobs?search=${encodeURIComponent(query)}`)
    setQuery("")
  }

  return (
    <div className="relative w-full max-w-2xl" dir="rtl">
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder="חפש משרות, חברות, תחומים..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch()
          }
        }}
        className="w-full bg-white/10 border border-white/20 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
      />
    </div>
  )
}
