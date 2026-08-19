import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { httpClient } from "@/api/client/httpClient"
import { useAuth } from "@/lib/AuthContext"
import { FileText, Download } from "lucide-react"
import Navbar from "@/components/home/Navbar"

export default function Resumes() {
  const [filter, setFilter] = useState("incoming") // incoming | mine | submitted
  const { user } = useAuth()

  // קורות חיים שהגיעו למעסיקים שלך (אם אתה מעסיק)
  const { data: incomingResumes = [] } = useQuery({
    queryKey: ["incoming-resumes", user?.email],
    queryFn: async () => {
      if (!user) return []
      const applications = await httpClient.get(
        `/applications?employer_id=${encodeURIComponent(user.email)}`,
        { cache: false },
      )
      const arr = Array.isArray(applications) ? applications : applications?.data || []
      return arr
        .filter((a) => a.resume_url)
        .map((a) => ({
          id: a.id,
          name: a.candidate_name,
          email: a.candidate_email,
          url: a.resume_url,
          job: a.job_title,
          date: a.created_date,
          type: "incoming",
        }))
    },
    enabled: !!user,
  })

  // קורות חיים שלי (הפרופיל שלי)
  const { data: myResumes = [] } = useQuery({
    queryKey: ["my-resumes", user?.email],
    queryFn: async () => {
      if (!user) return []
      const raw = await httpClient.get(
        `/candidates/profiles?user_email=${encodeURIComponent(user.email)}`,
        { cache: false },
      )
      const profiles = Array.isArray(raw) ? raw : raw?.data || []
      const profile = profiles[0]
      if (!profile || !profile.resume_url) return []
      return [
        {
          id: profile.id,
          name: user.full_name,
          email: user.email,
          url: profile.resume_url,
          job: profile.title || "קורות חיים",
          date: profile.updated_date,
          type: "mine",
        },
      ]
    },
    enabled: !!user,
  })

  // קורות חיים שהגשתי (בהגשות שלי)
  const { data: submittedResumes = [] } = useQuery({
    queryKey: ["submitted-resumes", user?.email],
    queryFn: async () => {
      if (!user) return []
      const applications = await httpClient.get(
        `/applications?candidate_email=${encodeURIComponent(user.email)}`,
        { cache: false },
      )
      const arr = Array.isArray(applications) ? applications : applications?.data || []
      return arr
        .filter((a) => a.resume_url)
        .map((a) => ({
          id: a.id,
          name: a.candidate_name,
          email: a.candidate_email,
          url: a.resume_url,
          job: a.job_title,
          date: a.created_date,
          type: "submitted",
        }))
    },
    enabled: !!user,
  })

  const filtered =
    filter === "incoming" ? incomingResumes : filter === "mine" ? myResumes : submittedResumes
  const isEmployer = user?.role === "employer" || incomingResumes.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">קורות חיים</h1>
          <p className="text-gray-500 text-sm mt-2">נהל את קורות החיים שלך</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {isEmployer && (
            <button
              onClick={() => setFilter("incoming")}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                filter === "incoming"
                  ? "border-hhblue text-hhblue"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              קורות חיים שהגיעו ({incomingResumes.length})
            </button>
          )}
          <button
            onClick={() => setFilter("mine")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              filter === "mine"
                ? "border-hhblue text-hhblue"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            קורות חיים שלי ({myResumes.length})
          </button>
          <button
            onClick={() => setFilter("submitted")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              filter === "submitted"
                ? "border-hhblue text-hhblue"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            קורות חיים שהגשתי ({submittedResumes.length})
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
            {filter === "incoming" && "📄 אין קורות חיים שהגיעו"}
            {filter === "mine" && "📄 העלה קורות חיים בפרופיל שלך"}
            {filter === "submitted" && "📄 לא הגשת קורות חיים"}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-hhblue/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-hhblue" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{resume.name}</h3>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{resume.job}</p>
                    <p className="text-xs text-gray-500 mt-1">{resume.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={resume.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
                    title="הורד קובץ"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
