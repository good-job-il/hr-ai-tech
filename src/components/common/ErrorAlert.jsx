export default function ErrorAlert({
  error,
  onDismiss,
  onRetry = null,
  details = null,
  source = null,
}) {
  if (!error) {
    return null
  }

  // Parse error message if it's structured
  const isStructured = typeof error === "object"

  const message = isStructured ? error.message : error

  const code = isStructured ? error.code : null

  const context = isStructured ? error.context : null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" dir="rtl">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="font-semibold text-red-900 text-sm">⚠️ שגיאה</h3>

          <p className="text-red-800 text-sm mt-1">{message}</p>

          {/* Error Details */}
          {(code || source || context?.timestamp) && (
            <details className="mt-3 cursor-pointer">
              <summary className="text-xs text-red-700 font-medium hover:text-red-900">
                <HelpCircle className="w-3 h-3 inline mr-1" /> פרטים נוספים
              </summary>

              <div className="mt-2 p-2 bg-red-100/50 rounded text-xs text-red-800 space-y-1 font-mono">
                {code && <div>📌 קוד שגיאה: {code}</div>}

                {source && <div>📍 מקור: {source}</div>}

                {context?.timestamp && (
                  <div>⏰ זמן: {new Date(context.timestamp).toLocaleString("he-IL")}</div>
                )}

                {context?.failed_count && <div>❌ פריטים שנכשלו: {context.failed_count}</div>}
              </div>
            </details>
          )}

          {/* Recovery Suggestion */}
          {context?.recovery_suggestion && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800">
              💡 <strong>הצעה:</strong> {context.recovery_suggestion}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-red-700 hover:text-red-900 font-medium text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> נסה שוב
              </button>
            )}

            {onDismiss && (
              <button onClick={onDismiss} className="text-red-600 hover:text-red-800 ml-auto">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
