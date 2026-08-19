export default function AdminAutomations() {
  return (
    <AdminLayout>
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">אוטומציות ובינה מלאכותית</h1>
        <p className="text-gray-500 text-sm">ניהול תהליכים אוטומטיים ו-AI</p>
        <span className="mt-4 px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
          בפיתוח
        </span>
      </div>
    </AdminLayout>
  )
}
