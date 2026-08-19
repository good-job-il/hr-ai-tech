import React from "react"
import { Link } from "react-router-dom"
import { Sparkles, Users, BarChart3, Zap, Filter, Brain } from "lucide-react"
import Header from "@/components/home/Header"

export default function EmployerLanding() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Glows */}
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/8 blur-3xl rounded-full animate-pulse"></div>
        <div
          className="absolute bottom-40 left-40 w-96 h-96 bg-blue-400/8 blur-3xl rounded-full"
          style={{ animation: "pulse 4s ease-in-out infinite" }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left: CTA */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-100/50 border border-blue-200">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-blue-700 text-xs font-semibold">ATS + AI Matching</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
              מגייסים חכם יותר עם AI
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
              מערכת גיוס מתקדמת שמחברת אתכם למועמדים איכותיים במהירות. כל משרה, בדקות.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/employer/dashboard"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all active:scale-95"
              >
                פתיחת חשבון מעסיק
              </Link>
              <button className="bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-lg font-bold px-8 py-4 rounded-xl transition-all active:scale-95">
                קביעת דמו
              </button>
            </div>
          </div>

          {/* Right: Dashboard Preview */}
          <div className="relative h-[500px] flex items-center justify-center lg:justify-end">
            <div
              className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-blue-200/80 rounded-2xl p-6 shadow-2xl"
              style={{ animation: "float 3s ease-in-out infinite" }}
            >
              <div className="space-y-4">
                {/* Card 1: ATS */}
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Filter className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-gray-900">ATS מתקדם</span>
                  </div>
                  <p className="text-sm text-gray-600">ניהול מלא של משרות ומועמדים</p>
                </div>

                {/* Card 2: Candidates */}
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-gray-900">1,200+ מועמדים</span>
                  </div>
                  <p className="text-sm text-gray-600">בחיפוש משרה כרגע</p>
                </div>

                {/* Card 3: AI Matching */}
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-gray-900">AI Matching</span>
                  </div>
                  <p className="text-sm text-gray-600">זיהוי מועמדים בעלי התאמה מושלמת</p>
                </div>

                {/* Card 4: Analytics */}
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-gray-900">Analytics</span>
                  </div>
                  <p className="text-sm text-gray-600">דוחות ותובנות בזמן אמת</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </section>

      {/* Why Choose */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              למה חברות בוחרות ב־HeadHunter?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Brain,
                title: "AI Matching חכם",
                desc: "אלגוריתם שלנו מוצא את 5 המועמדים הטובים ביותר לכל משרה.",
              },
              { icon: Zap, title: "מהיר", desc: "מפתיחת משרה לראיון ראשון בתוך 48 שעות." },
              {
                icon: BarChart3,
                title: "Analytics",
                desc: "דוחות מלאים על כל שלב של תהליך הגיוס.",
              },
              {
                icon: Users,
                title: "מועמדים איכותיים",
                desc: "כל מועמד עבר מסננים איכות קפדניים.",
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="bg-white border border-blue-200/80 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-purple-400 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-blue-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-bold text-gray-900 text-center mb-16">
            תכונות מתקדמות לגיוס חכם
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "ATS מתקדם", desc: "ניהול מלא של משרות, מועמדים, ראיונות והצעות." },
              { title: "ייבוא מועמדים", desc: "העלאת קורות חיים באופן גורף וניתוח אוטומטי." },
              { title: "AI Job Match", desc: "תאימת מועמדים אוטומטית בהתאם לדרישות המשרה." },
              { title: "Pipeline Editor", desc: "בנייה של תהליך גיוס מותאם אישית לחברה שלכם." },
              { title: "Analytics & Reporting", desc: "דוחות מצטברים על כל שלב של הגיוס." },
              { title: "Automation", desc: "אוטומציה של משימות חוזרות להעלאת יעילות." },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border border-blue-200/80 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">מוכנים להתחיל?</h2>
          <p className="text-xl mb-12 opacity-90">
            הצטרפו לחברות המובילות שכבר משתמשות ב־HeadHunter כדי לגייס בחכמה.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/employer/dashboard"
              className="bg-white text-purple-600 hover:bg-blue-50 text-lg font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all active:scale-95"
            >
              פתיחת חשבון מעסיק
            </Link>
            <button className="bg-white/20 border-2 border-white text-white hover:bg-white/30 text-lg font-bold px-8 py-4 rounded-xl transition-all active:scale-95">
              דברו עם מומחה
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
