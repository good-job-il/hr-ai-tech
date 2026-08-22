export default function AdminSystemSettings() {
  return (
    <AdminLayout>
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-gray-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">הגדרות מערכת</h1>

        <p className="text-gray-500 text-sm">הגדרות כלליות, API keys, תצורת המערכת</p>

        <span className="mt-4 px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
          בפיתוח
        </span>
      </div>
    </AdminLayout>
  )
}
import AdminLayout from "@/components/admin/AdminLayout"
import { Settings } from "lucide-react"
