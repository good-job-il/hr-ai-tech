import React from "react"
import {
  Users,
  BriefcaseBusiness,
  Building2,
  TrendingUp,
  Bell,
  Activity,
  Brain,
  ShieldCheck,
  ArrowUpRight,
  Clock3,
  UserCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"

const glass =
  "bg-white/80 backdrop-blur-2xl border border-[#DDEBFF] rounded-lg shadow-[0_24px_80px_rgba(79,124,255,0.10)]"

const stats = [
  {
    title: "מועמדים פעילים",
    value: "24,891",
    change: "+12.4%",
    icon: Users,
    color: "from-[#8B5CF6] to-[#6C4DFF]",
  },
  {
    title: "משרות פעילות",
    value: "1,284",
    change: "+6.1%",
    icon: BriefcaseBusiness,
    color: "from-[#2F80FF] to-[#38BDF8]",
  },
  {
    title: "חברות פעילות",
    value: "412",
    change: "+18.2%",
    icon: Building2,
    color: "from-[#06B6D4] to-[#3B82F6]",
  },
  {
    title: "יחס המרה",
    value: "68%",
    change: "+4.9%",
    icon: TrendingUp,
    color: "from-[#7C3AED] to-[#2563EB]",
  },
]

const activities = [
  {
    title: "חברת הייטק חדשה נרשמה למערכת",
    time: "לפני 8 דקות",
  },
  {
    title: "124 מועמדים יובאו אוטומטית",
    time: "לפני 22 דקות",
  },
  {
    title: "AI Matching השלים סריקה חדשה",
    time: "לפני שעה",
  },
  {
    title: "מנהל גיוס אישר 18 מועמדים",
    time: "לפני שעתיים",
  },
]

const alerts = [
  {
    title: "3 משרות ללא מועמדים",
    type: "warning",
  },
  {
    title: "2 חברות דורשות אישור",
    type: "info",
  },
  {
    title: "AI Screening זיהה כפילויות",
    type: "danger",
  },
]

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div
        dir="rtl"
        className="min-h-screen bg-[linear-gradient(180deg,#F7FBFF_0%,#EEF6FF_100%)] px-6 lg:px-8 xl:px-[32px] py-10"
      >
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[#DDEBFF] text-[#6C4DFF] font-bold shadow-sm mb-4">
                <Sparkles className="w-4 h-4" />
                מרכז השליטה של HeadHunter HR-Tech
              </div>

              <h1 className="text-[52px] leading-[1] font-black text-[#0F172A] mb-4">
                דשבורד
                <span className="bg-gradient-to-l from-[#6C4DFF] via-[#4F7CFF] to-[#2FB8FF] bg-clip-text text-transparent">
                  {" "}
                  אדמין
                </span>
              </h1>

              <p className="text-[#64748B] text-xl max-w-[760px] leading-9">
                ניהול מלא של פלטפורמת הגיוס, ניטור ביצועים, אנליטיקות AI, חברות, מועמדים ומשרות —
                בממשק אחד.
              </p>
            </div>

            <div className={`${glass} p-5 min-w-[320px] bg-gradient-to-br from-white to-[#F3F7FF]`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#8B5CF6] via-[#6C4DFF] to-[#2FB8FF] flex items-center justify-center shadow-[0_20px_45px_rgba(108,77,255,0.25)]">
                  <Brain className="w-8 h-8 text-white" />
                </div>

                <div>
                  <div className="text-[#0F172A] font-black text-lg">AI System Status</div>
                  <div className="text-[#64748B]">כל המערכות פעילות ותקינות</div>
                </div>
              </div>

              <div className="mt-5 h-3 rounded-full bg-[#E9F0FF] overflow-hidden">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#2FB8FF]" />
              </div>

              <div className="mt-2 text-sm text-[#64748B] font-bold">92% ביצועי מערכת</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
            {stats.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className={`${glass} p-7 hover:-translate-y-1 transition-all`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-[#64748B] font-bold mb-2">{item.title}</div>

                      <div className="text-[44px] leading-none font-black text-[#0F172A] mb-3">
                        {item.value}
                      </div>

                      <div className="inline-flex items-center gap-1 text-[#12B981] font-black">
                        <ArrowUpRight className="w-4 h-4" />
                        {item.change}
                      </div>
                    </div>

                    <div
                      className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-[0_20px_45px_rgba(108,77,255,0.18)]`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-[#EEF3FF] overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.color} w-[72%]`} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8 mb-12">
            <div className={`${glass} p-8`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-[34px] leading-none font-black text-[#0F172A] mb-2">
                    אנליטיקות מערכת
                  </h2>
                  <p className="text-[#64748B] text-lg">ביצועי המערכת ב־30 הימים האחרונים</p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2FB8FF] flex items-center justify-center shadow-lg">
                  <Activity className="w-7 h-7 text-white" />
                </div>
              </div>

              <div className="h-[360px] rounded-lg bg-gradient-to-br from-[#F7FAFF] to-[#EEF5FF] border border-[#DDEBFF] relative overflow-hidden">
                <div className="absolute inset-0 opacity-60">
                  <svg width="100%" height="100%" viewBox="0 0 900 360" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="line1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#2FB8FF" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0 290 C120 260 180 120 280 140 C380 160 430 300 540 250 C640 210 720 80 900 120"
                      fill="none"
                      stroke="url(#line1)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />

                    <path
                      d="M0 320 C120 280 220 210 340 220 C450 230 560 110 680 140 C760 160 840 230 900 190"
                      fill="none"
                      stroke="#C4B5FD"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                  </svg>
                </div>

                <div className="absolute bottom-6 right-6 left-6 flex justify-between text-sm font-bold text-[#64748B]">
                  <span>ינואר</span>
                  <span>פברואר</span>
                  <span>מרץ</span>
                  <span>אפריל</span>
                  <span>מאי</span>
                  <span>יוני</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${glass} p-7`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2F80FF] to-[#38BDF8] flex items-center justify-center shadow-lg">
                    <Bell className="w-7 h-7 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-[#0F172A]">פעילות אחרונה</h3>
                    <p className="text-[#64748B]">עדכונים בזמן אמת</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {activities.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FBFF] border border-[#E4ECFF]"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2FB8FF] flex items-center justify-center text-white">
                        <Clock3 className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="font-black text-[#0F172A] mb-1">{item.title}</div>

                        <div className="text-sm text-[#64748B]">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${glass} p-7`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-[#0F172A]">התראות מערכת</h3>
                    <p className="text-[#64748B]">בעיות שדורשות טיפול</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.title}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFF8F4] border border-[#FFE2D5]"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>

                      <div className="font-black text-[#0F172A]">{alert.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`${glass} p-8`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[34px] leading-none font-black text-[#0F172A] mb-2">
                  פעילות גיוס אחרונה
                </h2>

                <p className="text-[#64748B] text-lg">סטטוס פעילות מכל המחלקות</p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#2563EB] flex items-center justify-center shadow-lg">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E4ECFF]">
              <table className="w-full">
                <thead className="bg-[#F8FBFF]">
                  <tr className="text-right">
                    {["שם", "תפקיד", "חברה", "סטטוס", "תאריך", "AI Score"].map((h) => (
                      <th key={h} className="px-6 py-5 text-sm font-black text-[#64748B]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EEF3FF] bg-white">
                  {[
                    ["דניאל כהן", "Full Stack", "Wix", "ראיון מתקדם", "היום", "94%"],
                    ["נועה לוי", "Product Manager", "Monday", "התקבל", "היום", "97%"],
                    ["יובל ישראלי", "DevOps", "Google", "Screening", "אתמול", "88%"],
                    ["שחר אוחנה", "UX/UI", "Palo Alto", "הצעה", "אתמול", "91%"],
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[#FAFCFF] transition">
                      {row.map((cell, idx) => (
                        <td key={idx} className="px-6 py-5 text-sm font-bold text-[#0F172A]">
                          {idx === 5 ? (
                            <span className="px-4 py-2 rounded-full bg-gradient-to-l from-[#8B5CF6] to-[#2FB8FF] text-white text-xs font-black">
                              {cell}
                            </span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
