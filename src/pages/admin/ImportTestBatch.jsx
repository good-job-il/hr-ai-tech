import { useState } from "react"

export default function ImportTestBatch() {
  const [testMode, setTestMode] = useState("disabled")

  const [testSize, setTestSize] = useState("10")

  const [importComplete, setImportComplete] = useState(false)

  const testSizes = [
    { value: "10", label: "10 קורות חיים - בדיקה בסיסית", description: "בדיקה מהירה של כל מערכות" },
    {
      value: "30",
      label: "30 קורות חיים - בדיקה בינונית",
      description: "כולל duplicate detection",
    },
    {
      value: "50",
      label: "50 קורות חיים - בדיקה מלאה",
      description: "בדיקה מקיפה לפני ייבוא גדול",
    },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ייבוא מועמדים - בדיקה בשלבים</h1>

          <p className="text-gray-600 mt-2">בדוק את מערכת הייבוא בשלבים קטנים לפני ייבוא המוני</p>
        </div>

        {/* Test Mode Selection */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />

            <div>
              <p className="font-semibold text-blue-900 mb-2">מדדי בדיקה מומלצים</p>

              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>התחל ב-10 קורות חיים לבדיקה בסיסית</li>

                <li>אם הכל יציב → בדוק 30 קורות חיים</li>

                <li>אם הכל יציב → בדוק 50 קורות חיים</li>

                <li>רק אז התחל בייבוא גדול (אלפי)</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Test Size Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">בחר גודל בדיקה</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => setTestSize(size.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  testSize === size.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-semibold text-gray-900">{size.label}</p>

                <p className="text-sm text-gray-600 mt-2">{size.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">בדיקות חובה לפני upload</h2>

          <div className="space-y-2">
            {[
              "ZIP file עם קורות חיים בפורמטים: PDF, DOC, DOCX, TXT",
              "קובצים בעברית או אנגלית",
              "תמיכה בזיהוי שדות: שם, טלפון, מייל, תפקיד",
              "המרה אוטומטית ל-DOCX לכל קובץ",
              "זיהוי כפילויות אוטומטי",
              "הקצאה אוטומטית למגייס",
              "preview ו-download של קורות חיים",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />

                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        {!importComplete ? (
          <ResumeZipUploader onImportComplete={() => setImportComplete(true)} />
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />

              <div>
                <p className="font-semibold text-green-900 mb-2">ייבוא בדיקה הושלם בהצלחה!</p>

                <p className="text-sm text-green-800 mb-4">
                  בדוק את עמוד "בדיקת איכות מועמדים" כדי לראות את התוצאות המלאות ו-resumption בדיקה.
                </p>

                <button
                  onClick={() => setImportComplete(false)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                >
                  העלה batch נוסף
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Results Info */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">מה לבדוק בתוצאות</h3>

          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ כל קורות החיים הועלו בהצלחה</li>

            <li>✓ כל קובץ הומר ל-DOCX</li>

            <li>✓ שדות נחלצו בדיוק (שם, טלפון, מייל)</li>

            <li>✓ לא יש כפילויות חשודות</li>

            <li>✓ preview עובד לכל resume</li>

            <li>✓ download עובד לכל resume</li>

            <li>✓ resumes נשמרו אחרי refresh</li>

            <li>✓ resumes זמינים אחרי logout/login</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
import AdminLayout from "@/components/admin/AdminLayout"
import { CheckCircle2, Info } from "lucide-react"
import ResumeZipUploader from "@/components/admin/ResumeZipUploader"
