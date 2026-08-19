import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { candidateProfileService } from "@/api/services/candidateProfileService"
import { fileService } from "@/api/services/fileService"
import { useAuth } from "@/lib/AuthContext"

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
  "אחר",
]

export default function CandidateProfilePage() {
  const { user } = useAuth()

  const queryClient = useQueryClient()

  const [skillInput, setSkillInput] = useState("")

  const [saved, setSaved] = useState(false)

  const { data: profile = null, isLoading } = useQuery({
    queryKey: ["my-profile", user?.email],
    queryFn: () => candidateProfileService.me(),
    enabled: !!user,
  })

  const [form, setForm] = useState(null)

  React.useEffect(() => {
    if (profile && !form) {
      setForm({ ...profile })
    } else if (!profile && !form && user) {
      setForm({
        user_email: user.email,
        full_name: user.full_name || "",
        phone: "",
        location: "",
        title: "",
        summary: "",
        skills: [],
        experience_years: 0,
        education: "",
        experience: [],
        desired_salary_min: "",
        desired_salary_max: "",
        job_type: "any",
        categories: [],
        is_public: true,
        resume_url: "",
      })
    }
  }, [profile, user])

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const { id: _id, user_email: _userEmail, ...profileData } = data

      if (profile) {
        return candidateProfileService.update(profileData)
      }

      return candidateProfileService.create(profileData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const uploadResume = async (e) => {
    const file = e.target.files[0]

    if (!file) {
      return
    }

    const { file_url } = await fileService.upload(file)

    setForm((f) => ({ ...f, resume_url: file_url }))
  }

  const addSkill = () => {
    if (!skillInput.trim()) {
      return
    }

    setForm((f) => ({ ...f, skills: [...(f.skills || []), skillInput.trim()] }))
    setSkillInput("")
  }

  const removeSkill = (i) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }))

  const addExp = () =>
    setForm((f) => ({
      ...f,
      experience: [...(f.experience || []), { company: "", role: "", years: "", description: "" }],
    }))

  const updateExp = (i, field, val) =>
    setForm((f) => ({
      ...f,
      experience: f.experience.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)),
    }))

  const removeExp = (i) =>
    setForm((f) => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }))

  if (isLoading || !form) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#eaf7fb" }} dir="rtl">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">הפרופיל שלי</h1>
            <p className="text-gray-500 text-sm mt-2">נהל את מידע הקורות החיים שלך</p>
          </div>
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 h-10 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saved ? "✓ נשמר!" : saveMutation.isPending ? "שומר..." : "שמור"}
          </button>
        </div>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">פרטים אישיים</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["full_name", "שם מלא"],
                ["phone", "טלפון"],
                ["location", "מיקום"],
                ["title", "תפקיד מבוקש"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                  <input
                    value={form[key] || ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">סיכום קצר</label>
                <textarea
                  value={form.summary || ""}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">כישורים</h2>
            <div className="flex gap-2 mb-3">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                placeholder="הוסף כישור..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
              />
              <button
                onClick={addSkill}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-3.5 h-10 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.skills || []).map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-hhblue/10 text-hhblue text-xs px-3 py-1.5 rounded-full"
                >
                  {s}
                  <button onClick={() => removeSkill(i)} className="hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">ניסיון תעסוקתי</h2>
              <button
                onClick={addExp}
                className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                הוסף
              </button>
            </div>
            <div className="space-y-3">
              {(form.experience || []).map((exp, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={exp.company}
                      onChange={(e) => updateExp(i, "company", e.target.value)}
                      placeholder="חברה"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    <input
                      value={exp.role}
                      onChange={(e) => updateExp(i, "role", e.target.value)}
                      placeholder="תפקיד"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    <input
                      value={exp.years}
                      onChange={(e) => updateExp(i, "years", e.target.value)}
                      placeholder="שנים (למשל: 2020–2023)"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none col-span-2"
                    />
                  </div>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExp(i, "description", e.target.value)}
                    placeholder="תיאור קצר"
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  />
                  <button
                    onClick={() => removeExp(i)}
                    className="text-red-500 text-xs font-medium hover:text-red-700 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Trash2 className="w-3 h-3" /> הסר
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">העדפות עבודה</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">שנות ניסיון</label>
                <input
                  type="number"
                  value={form.experience_years || ""}
                  onChange={(e) => setForm((f) => ({ ...f, experience_years: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">שכר מינימום</label>
                <input
                  type="number"
                  value={form.desired_salary_min || ""}
                  onChange={(e) => setForm((f) => ({ ...f, desired_salary_min: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">סוג משרה</label>
                <select
                  value={form.job_type}
                  onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                >
                  <option value="any">כל הסוגים</option>
                  <option value="full">משרה מלאה</option>
                  <option value="part">חלקית</option>
                  <option value="remote">מרחוק</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <label className="text-xs font-medium text-gray-600 block mb-1">השכלה</label>
                <input
                  value={form.education || ""}
                  onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
                  placeholder="תואר, מוסד, שנה..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
              />
              פרופיל גלוי למעסיקים
            </label>
            <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_open_to_work || false}
                onChange={(e) => setForm((f) => ({ ...f, is_open_to_work: e.target.checked }))}
              />
              <span
                className={`font-medium ${form.is_open_to_work ? "text-green-600" : "text-gray-700"}`}
              >
                {form.is_open_to_work ? "🟢 פעיל/ה לחיפוש עבודה" : "פעיל/ה לחיפוש עבודה"}
              </span>
            </label>
          </div>

          {/* Resume upload */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">קורות חיים (PDF)</h2>
            <label className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {form.resume_url ? "עדכן קובץ" : "העלה קורות חיים"}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={uploadResume}
              />
            </label>
            {form.resume_url && (
              <a
                href={form.resume_url}
                target="_blank"
                rel="noreferrer"
                className="text-hhblue text-sm mt-2 hover:underline block"
              >
                צפה בקובץ שהועלה
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
