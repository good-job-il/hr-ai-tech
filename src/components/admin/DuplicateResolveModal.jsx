export default function DuplicateResolveModal({ duplicate, onResolve, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-yellow-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />

            <h2 className="text-xl font-bold text-gray-900">פתרון כפילות</h2>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* New */}
            <div className="border border-green-200 bg-green-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-900 mb-3">קובץ חדש</p>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">שם:</span>

                  <span className="font-medium text-gray-900 block">
                    {duplicate.extracted.full_name}
                  </span>
                </p>

                {duplicate.extracted.email && (
                  <p>
                    <span className="text-gray-600">מייל:</span>

                    <span className="text-gray-900 block">{duplicate.extracted.email}</span>
                  </p>
                )}

                {duplicate.extracted.phone && (
                  <p>
                    <span className="text-gray-600">טלפון:</span>

                    <span className="text-gray-900 block">{duplicate.extracted.phone}</span>
                  </p>
                )}

                {duplicate.extracted.role_name && (
                  <p>
                    <span className="text-gray-600">תפקיד:</span>

                    <span className="text-gray-900 block">{duplicate.extracted.role_name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Existing */}
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-900 mb-3">קיים כבר</p>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">שם:</span>

                  <span className="font-medium text-gray-900 block">
                    {duplicate.existingCandidate.full_name}
                  </span>
                </p>

                {duplicate.existingCandidate.email && (
                  <p>
                    <span className="text-gray-600">מייל:</span>

                    <span className="text-gray-900 block">{duplicate.existingCandidate.email}</span>
                  </p>
                )}

                {duplicate.existingCandidate.phone && (
                  <p>
                    <span className="text-gray-600">טלפון:</span>

                    <span className="text-gray-900 block">{duplicate.existingCandidate.phone}</span>
                  </p>
                )}

                {duplicate.existingCandidate.role_name && (
                  <p>
                    <span className="text-gray-600">תפקיד:</span>

                    <span className="text-gray-900 block">
                      {duplicate.existingCandidate.role_name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">סיבת החשד:</p>

            <p className="text-sm text-gray-900 font-medium capitalize">
              {duplicate.reason === "email_match" && "התאמה של אימייל"}

              {duplicate.reason === "phone_match" && "התאמה של טלפון"}

              {duplicate.reason === "name_match" && "התאמה של שם"}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">בחר פעולה:</p>

            <button
              onClick={() => onResolve("skip")}
              className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <p className="font-semibold text-gray-900">⏭️ דלג</p>

              <p className="text-xs text-gray-600 mt-1">לא ליצור מועמד זה</p>
            </button>

            <button
              onClick={() => onResolve("create_anyway")}
              className="w-full text-left p-4 border border-yellow-300 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <p className="font-semibold text-gray-900">⚠️ יצור בכל זאת</p>

              <p className="text-xs text-gray-700 mt-1">יצור מועמד חדש ודייא על כפילות</p>
            </button>

            <button
              onClick={() => onResolve("merge")}
              className="w-full text-left p-4 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />

                <p className="font-semibold text-gray-900">🔗 מזג</p>
              </div>

              <p className="text-xs text-gray-700 mt-1">מזג עם המועמד הקיים (update resume)</p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}
import { X, AlertCircle, Users } from "lucide-react"
