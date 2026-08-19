import { useState, useEffect } from "react"
import { savedJobService } from "@/api/services/savedJobService"

export default function SaveJobButton({ job, user }) {
  const [saved, setSaved] = useState(false)

  const [savedId, setSavedId] = useState(null)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    savedJobService
      .list(job.id)
      .then((arr) => {
        if (arr.length > 0) {
          setSaved(true)
          setSavedId(arr[0].id)
        }
      })
      .catch(() => {})
  }, [user, job.id])

  const toggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      window.location.href = "/login"

      return
    }

    setLoading(true)

    if (saved) {
      await savedJobService.remove(savedId)
      setSaved(false)
      setSavedId(null)
    } else {
      const res = await savedJobService.save({
        job_id: job.id,
        job_title: job.title,
        company: job.company,
      })

      setSaved(true)
      setSavedId(res.id)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? "הסר שמירה" : "שמור משרה"}
      className={`p-1.5 rounded-lg transition-colors ${saved ? "text-hhblue bg-hhblue/10" : "text-gray-400 hover:text-hhblue hover:bg-hhblue/10"}`}
    >
      <Bookmark className={`w-4 h-4 ${saved ? "fill-hhblue" : ""}`} />
    </button>
  )
}
