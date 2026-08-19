export default function UnauthorizedAccess({ userType, requiredType }) {
  const typeLabels = {
    candidate: "מועמד",
    employer: "מעסיק",
    recruiter: "מגייס",
    team_manager: "מנהל צוות",
    hiring_manager: "מנהל גיוס",
    admin: "מנהל מערכת",
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      dir="rtl"
      style={{ backgroundColor: "#eaf7fb" }}
    >
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">גישה מוגבלת</h1>

        <p className="text-gray-600 mb-2">
          {userType ? (
            <>
              אתה מחובר כ<strong>{typeLabels[userType]}</strong>, אבל דף זה זמין רק עבור{" "}
              <strong>{typeLabels[requiredType]}</strong>.
            </>
          ) : (
            <>דף זה זמין רק למשתמשים רשומים.</>
          )}
        </p>

        <p className="text-gray-500 text-sm mb-6">אם אתה חושב שזה טעות, יצור קשר עם תמיכה.</p>

        <Link
          to="/"
          className="bg-hhblue text-white px-6 py-3 rounded-lg font-semibold hover:bg-hhblue/90 transition-colors inline-block"
        >
          חזור לעמוד הבית
        </Link>
      </div>
    </div>
  )
}
