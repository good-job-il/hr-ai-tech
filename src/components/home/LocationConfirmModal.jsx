import { useState } from "react"

export default function LocationConfirmModal({ initialCity, onConfirm, onDismiss }) {
  const [city, setCity] = useState(initialCity)

  const [customCity, setCustomCity] = useState("")

  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleConfirm = () => {
    const finalCity = showCustomInput ? customCity : city

    if (finalCity.trim()) {
      onConfirm(finalCity)
    }
  }

  const handleReject = () => {
    setShowCustomInput(true)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      dir="rtl"
    >
      <div className="bg-card border border-purple-500/30 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">האם זה המיקום שלך?</h3>

          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showCustomInput ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">אנו זיהינו שאתה בעיר:</p>

            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-cyan-300">{city}</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleReject} variant="outline" className="flex-1">
                לא, אחר
              </Button>

              <Button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg hover:shadow-purple-500/50"
              >
                כן, נכון
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">אנא בחר את העיר שלך:</p>

            <input
              type="text"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              placeholder="הקלד שם עיר..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-muted-foreground outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowCustomInput(false)
                  setCustomCity("")
                }}
                variant="outline"
                className="flex-1"
              >
                חזור
              </Button>

              <Button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg hover:shadow-purple-500/50"
                disabled={!customCity.trim()}
              >
                אישור
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
