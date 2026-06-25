import PublicLayout from '@/components/layouts/PublicLayout';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, BookOpen, Calculator, TrendingUp, Download, Sparkles, Video } from 'lucide-react';

export default function ResourcesPage() {
  const { i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');

  const CATEGORIES = [
    {
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      title: isRtl ? 'תבניות קורות חיים' : 'Resume Templates',
      desc: isRtl ? 'תבניות מקצועיות שמגייסים אוהבים' : 'Professional templates that recruiters love',
      items: [
        { name: isRtl ? 'תבנית CV טכנולוגי' : 'Tech CV Template', tag: isRtl ? 'פופולרי' : 'Popular', type: 'DOCX' },
        { name: isRtl ? 'תבנית CV שיווק ומכירות' : 'Marketing & Sales CV Template', tag: '', type: 'DOCX' },
        { name: isRtl ? 'תבנית CV מנהלים' : 'Executive CV Template', tag: isRtl ? 'חדש' : 'New', type: 'DOCX' },
        { name: isRtl ? 'תבנית CV אנגלית' : 'English CV Template', tag: '', type: 'DOCX' },
      ],
    },
    {
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
      title: isRtl ? 'מדריכים מקצועיים' : 'Professional Guides',
      desc: isRtl ? 'כל מה שצריך לדעת לחיפוש עבודה' : 'Everything you need to know for job searching',
      items: [
        { name: isRtl ? 'מדריך כתיבת קורות חיים' : 'Resume Writing Guide', tag: isRtl ? 'בסיסי' : 'Essential', type: 'PDF' },
        { name: isRtl ? 'מדריך ראיון עבודה' : 'Job Interview Guide', tag: isRtl ? 'פופולרי' : 'Popular', type: 'PDF' },
        { name: isRtl ? 'מדריך LinkedIn' : 'LinkedIn Guide', tag: '', type: 'PDF' },
        { name: isRtl ? 'מדריך לחיפוש עבודה ראשונה' : 'First Job Search Guide', tag: isRtl ? 'חדש' : 'New', type: 'PDF' },
      ],
    },
    {
      icon: Calculator,
      color: 'bg-green-100 text-green-600',
      title: isRtl ? 'כלים ומחשבונים' : 'Tools & Calculators',
      desc: isRtl ? 'חשב שכר, השווה תנאים, תכנן' : 'Calculate salary, compare offers, plan ahead',
      items: [
        { name: isRtl ? 'מחשבון שכר ברוטו-נטו' : 'Gross-to-Net Salary Calculator', tag: isRtl ? 'שימושי' : 'Useful', type: isRtl ? 'כלי' : 'Tool' },
        { name: isRtl ? 'מחשבון פנסיה והפרשות' : 'Pension & Benefits Calculator', tag: '', type: isRtl ? 'כלי' : 'Tool' },
        { name: isRtl ? 'השוואת הצעות עבודה' : 'Job Offer Comparison', tag: isRtl ? 'חדש' : 'New', type: isRtl ? 'כלי' : 'Tool' },
        { name: isRtl ? 'מחשבון ימי חופשה' : 'Vacation Days Calculator', tag: '', type: isRtl ? 'כלי' : 'Tool' },
      ],
    },
    {
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
      title: isRtl ? 'דוחות שוק העבודה' : 'Job Market Reports',
      desc: isRtl ? 'נתונים עדכניים ומגמות' : 'Up-to-date data and trends',
      items: [
        { name: isRtl ? 'דוח שכר הייטק Q1 2025' : 'High-Tech Salary Report Q1 2025', tag: isRtl ? 'עדכני' : 'Latest', type: 'PDF' },
        { name: isRtl ? 'מגמות גיוס 2025' : 'Recruitment Trends 2025', tag: '', type: 'PDF' },
        { name: isRtl ? 'דוח ביקוש לתפקידים' : 'Role Demand Report', tag: '', type: 'PDF' },
        { name: isRtl ? 'השפעת AI על שוק העבודה' : 'AI Impact on the Job Market', tag: isRtl ? 'חם' : 'Hot', type: 'PDF' },
      ],
    },
  ];

  const VIDEOS = [
    {
      title: isRtl ? 'איך לכתוב CV שמגייסים אוהבים' : 'How to write a CV that recruiters love',
      duration: '12:34',
      thumb: '🎬',
    },
    {
      title: isRtl ? '5 טיפים לראיון עבודה מוצלח' : '5 tips for a successful job interview',
      duration: '8:15',
      thumb: '🎯',
    },
    {
      title: isRtl ? 'כיצד ה-AI של HeadHunter עובד' : 'How HeadHunter AI works',
      duration: '5:20',
      thumb: '🤖',
    },
  ];

  return (
    <PublicLayout>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white">

        {/* Hero */}
        <div className="bg-gradient-to-b from-green-50 to-white py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              {isRtl ? 'משאבים חינמיים' : 'Free Resources'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              {isRtl ? (
                <>כלים ומשאבים<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">לקריירה שלך</span></>
              ) : (
                <>Tools and resources<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">for your career</span></>
              )}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {isRtl
                ? 'תבניות, מדריכים, דוחות שוק וכלים חינמיים — הכל במקום אחד'
                : 'Templates, guides, market reports and free tools — all in one place'}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* AI Tool Highlight */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="font-bold text-yellow-200 text-sm">
                  {isRtl ? 'כלי AI חינמי' : 'Free AI Tool'}
                </span>
              </div>
              <h3 className="text-2xl font-black mb-2">
                {isRtl ? 'ניתוח קורות החיים שלך עם AI' : 'Analyze your resume with AI'}
              </h3>
              <p className="text-purple-100 text-sm leading-relaxed max-w-md">
                {isRtl
                  ? 'העלה את ה-CV שלך וקבל ניתוח מעמיק תוך שניות — ציון, המלצות שיפור, וניסוח מחדש'
                  : 'Upload your CV and get a deep analysis within seconds — a score, improvement tips, and rephrasing suggestions'}
              </p>
            </div>
            <Link
              to="/ai-career"
              className="flex-shrink-0 bg-white text-purple-700 font-bold px-8 py-3 rounded-xl hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isRtl ? 'נסה בחינם' : 'Try for free'}
            </Link>
          </div>

          {/* Resource categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {CATEGORIES.map((cat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{cat.title}</h3>
                      <p className="text-xs text-gray-500">{cat.desc}</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors group">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800 group-hover:text-purple-700 transition-colors">{item.name}</span>
                        {item.tag && (
                          <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">{item.tag}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.type}</span>
                        <Download className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Video section */}
          <div className="mb-12">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Video className="w-6 h-6 text-red-500" />
              {isRtl ? 'סרטוני הדרכה' : 'Tutorial Videos'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {VIDEOS.map((vid, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 h-36 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{vid.thumb}</div>
                      <div className="w-12 h-8 bg-red-500 rounded-md flex items-center justify-center mx-auto">
                        <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-t-transparent border-b-transparent border-l-white mr-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">{vid.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">⏱ {vid.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              {isRtl ? 'קבל עדכונים על משאבים חדשים' : 'Get updates on new resources'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              {isRtl
                ? 'נשלח לך תבניות, דוחות וכלים חדשים ישירות לאימייל'
                : "We'll send you new templates, reports and tools directly to your email"}
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={isRtl ? 'האימייל שלך' : 'Your email'}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-purple-400"
                dir="ltr"
              />
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm">
                {isRtl ? 'הירשם' : 'Subscribe'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
