export function getNotifIcon(type) {
  const icons = {
    new_application: <Send className="w-4 h-4" />,
    application_viewed: <Eye className="w-4 h-4" />,
    status_changed: <Star className="w-4 h-4" />,
    interview_scheduled: <Calendar className="w-4 h-4" />,
    interview_reminder: <Calendar className="w-4 h-4" />,
    hired: <UserCheck className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />,
    job_match: <Briefcase className="w-4 h-4" />,
    job_closed: <Briefcase className="w-4 h-4" />,
    message: <MessageCircle className="w-4 h-4" />,
    new_user: <UserPlus className="w-4 h-4" />,
    new_employer: <Building className="w-4 h-4" />,
    import_error: <AlertTriangle className="w-4 h-4" />,
  }

  return icons[type] || <Bell className="w-4 h-4" />
}

export function getNotifColor(type) {
  const colors = {
    new_application: "bg-purple-100 text-purple-600",
    application_viewed: "bg-cyan-100 text-cyan-600",
    status_changed: "bg-blue-100 text-blue-600",
    interview_scheduled: "bg-green-100 text-green-600",
    interview_reminder: "bg-green-100 text-green-600",
    hired: "bg-emerald-100 text-emerald-600",
    rejected: "bg-red-100 text-red-500",
    job_match: "bg-yellow-100 text-yellow-600",
    job_closed: "bg-gray-100 text-gray-500",
    message: "bg-indigo-100 text-indigo-600",
    new_user: "bg-teal-100 text-teal-600",
    new_employer: "bg-orange-100 text-orange-600",
    import_error: "bg-red-100 text-red-500",
  }

  return colors[type] || "bg-gray-100 text-gray-500"
}

export const NOTIF_TYPE_LABELS = {
  new_application: "מועמדות חדשה",
  application_viewed: "צפייה בקורות חיים",
  status_changed: "עדכון סטטוס",
  interview_scheduled: "ראיון נקבע",
  interview_reminder: "תזכורת ראיון",
  hired: "התקבלת!",
  rejected: "דחייה",
  job_match: "משרה מתאימה",
  job_closed: "משרה נסגרה",
  message: "הודעה חדשה",
  new_user: "משתמש חדש",
  new_employer: "מעסיק חדש",
  import_error: "שגיאת ייבוא",
}
