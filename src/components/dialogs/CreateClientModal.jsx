import React, { useState } from "react"
import { agencyClientService } from "@/api/services/agencyClientService"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

export default function CreateClientModal({ isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation()
  const isRtl = !i18n.language?.startsWith("en")
  const [clientName, setClientName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!clientName.trim()) return
    setError("")
    setCreating(true)
    try {
      await agencyClientService.create({
        name: clientName,
        status: "active",
      })
      setClientName("")
      toast.success(t("agencyDashboard.clientModal.success"))
      onClose()
      onSuccess?.()
    } catch (err) {
      setError(err.message || t("agencyDashboard.clientModal.error"))
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-black text-gray-900 mb-4">
          {t("agencyDashboard.clientModal.title")}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t("agencyDashboard.clientModal.clientName")}
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t("agencyDashboard.clientModal.placeholder")}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-purple-400"
              disabled={creating}
            />
          </div>
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50"
              disabled={creating}
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50"
              disabled={creating || !clientName.trim()}
            >
              {creating
                ? t("agencyDashboard.clientModal.creating")
                : t("agencyDashboard.clientModal.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
