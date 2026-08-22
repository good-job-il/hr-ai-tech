import { useState, useEffect } from "react"
import { communicationService } from "@/api/services/communicationService"
import { useAuth } from "@/lib/AuthContext"

export default function RecruiterMessagesPage() {
  const { user } = useAuth()

  const [logs, setLogs] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const load = async () => {
    if (!user) {
      return
    }

    setLoading(true)
    setError("")

    try {
      setLogs(await communicationService.list({ limit: 50 }))
    } catch (requestError) {
      setLogs([])
      setError(requestError?.message || "Unable to load messages")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.email])

  const CHANNEL_LABELS = {
    email: "אימייל",
    whatsapp: "WhatsApp",
    phone: "טלפון",
    sms: "SMS",
    in_app: "באפליקציה",
    other: "אחר",
  }

  const DIR_COLORS = {
    outbound: "bg-blue-100 text-blue-700",
    inbound: "bg-green-100 text-green-700",
  }

  return (
    <div dir="rtl" className="space-y-5">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm font-bold text-[#7C3AED] hover:underline"
      >
        <span>←</span> חזרה לדשבורד
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">הודעות</h1>

          <p className="text-[#64748B] font-semibold mt-1">{logs.length} הודעות</p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> רענן
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E4ECFF]">
          <MessageSquare className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />

          <p className="font-bold text-[#94A3B8]">אין הודעות עדיין</p>

          <p className="text-sm text-[#CBD5E1] mt-1">הודעות שתשלח למועמדים יופיעו כאן</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden">
          {logs.map((log, i) => (
            <div
              key={log.id}
              className={`flex items-start gap-4 px-5 py-4 ${i < logs.length - 1 ? "border-b border-[#F0F1F5]" : ""} hover:bg-[#F7F8FC] transition-colors`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#F3EFFF] flex items-center justify-center flex-shrink-0 text-[#7C3AED] font-black text-sm">
                {(log.candidate_email || "?").charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-[#0F172A] truncate">
                    {log.candidate_email}
                  </span>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIR_COLORS[log.direction] || "bg-gray-100 text-gray-600"}`}
                  >
                    {log.direction === "outbound" ? "יוצא" : "נכנס"}
                  </span>

                  <span className="text-xs text-[#94A3B8]">
                    {CHANNEL_LABELS[log.channel] || log.channel}
                  </span>
                </div>

                {log.subject && (
                  <div className="text-xs font-semibold text-[#64748B] truncate">{log.subject}</div>
                )}

                <div className="text-xs text-[#94A3B8] truncate mt-0.5">{log.content}</div>
              </div>

              <div className="text-xs text-[#CBD5E1] whitespace-nowrap">
                {new Date(log.created_date).toLocaleDateString("he-IL")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { MessageSquare, RefreshCw } from "lucide-react"
