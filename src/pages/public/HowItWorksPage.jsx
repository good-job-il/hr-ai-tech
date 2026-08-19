import { useTranslation } from 'react-i18next';
import { UserPlus, Search, Sparkles, Send, CheckCircle, Briefcase, Building2, Brain } from 'lucide-react';

export default function HowItWorksPage() {
  const { i18n } = useTranslation();

  const isRtl = !i18n.language?.startsWith('en');

  const CANDIDATE_STEPS = [
    {
      icon: UserPlus,
      num: '1',
      title: isRtl ? 'יוצרים פרופיל' : 'Create a Profile',
      desc: isRtl
        ? 'הרשמה פשוטה עם אימייל. מלא את הפרופיל שלך — ניסיון, כישורים, ציפיות שכר ואיזור. מעלה קורות חיים וה-AI עושה את השאר.'
        : 'Simple sign-up with email. Fill in your profile — experience, skills, salary expectations and location. Upload your resume and the AI does the rest.',
      time: isRtl ? '2 דקות' : '2 minutes',
    },
    {
      icon: Sparkles,
      num: '2',
      title: isRtl ? 'AI מנתח ומתאים' : 'AI Analyzes & Matches',
      desc: isRtl
        ? 'המנוע שלנו סורק אלפי משרות ומחפש את ההתאמות הטובות ביותר עבורך — לפי ניסיון, כישורים, שכר ומיקום.'
        : 'Our engine scans thousands of jobs and finds the best matches for you — by experience, skills, salary and location.',
      time: isRtl ? 'אוטומטי' : 'Automatic',
    },
    {
      icon: Search,
      num: '3',
      title: isRtl ? 'מגלה משרות מותאמות' : 'Discover Matched Jobs',
      desc: isRtl
        ? 'קבל רשימה אישית של משרות שמתאימות לך, עם ציון התאמה והסבר מדוע. גם ממשרות שלא פרסמו עדיין.'
        : 'Get a personalized list of jobs that fit you, with a match score and explanation why. Including jobs not yet publicly posted.',
      time: isRtl ? 'בזמן אמת' : 'Real-time',
    },
    {
      icon: Send,
      num: '4',
      title: isRtl ? 'מגיש מועמדות בקליק' : 'Apply with One Click',
      desc: isRtl
        ? 'גש ממשרות בלחיצה אחת — הפרופיל שלך נשלח ישירות למגייס. אפשר גם לכתוב מכתב AI מותאם אישית.'
        : 'Apply to jobs with one click — your profile is sent directly to the recruiter. You can also write an AI-personalized cover letter.',
      time: isRtl ? '30 שניות' : '30 seconds',
    },
    {
      icon: CheckCircle,
      num: '5',
      title: isRtl ? 'עוקב אחרי ההגשות' : 'Track Your Applications',
      desc: isRtl
        ? 'לוח בקרה אישי לכל הגשה — סטטוס, עדכונים בזמן אמת, ותזכורות לראיונות.'
        : 'A personal dashboard for every application — status, real-time updates, and interview reminders.',
      time: isRtl ? 'תמיד מעודכן' : 'Always up to date',
    },
  ];

  const EMPLOYER_STEPS = [
    {
      icon: Briefcase,
      num: '1',
      title: isRtl ? 'מפרסמים משרה' : 'Post a Job',
      desc: isRtl
        ? 'טופס פשוט לפרסום משרה. AI ממלא אוטומטית דרישות ומילות מפתח כדי להגיע למועמדים הנכונים.'
        : 'A simple form to post a job. AI automatically fills in requirements and keywords to reach the right candidates.',
    },
    {
      icon: Brain,
      num: '2',
      title: isRtl ? 'AI מוצא מועמדים' : 'AI Finds Candidates',
      desc: isRtl
        ? 'המנוע סורק את מאגר המועמדים ומדרג לפי התאמה. תקבל רשימת מועמדים מומלצים תוך דקות.'
        : 'The engine scans the candidate pool and ranks by fit. You get a list of recommended candidates within minutes.',
    },
    {
      icon: Building2,
      num: '3',
      title: isRtl ? 'מנהל תהליך גיוס' : 'Manage Hiring Process',
      desc: isRtl
        ? 'לוח קנבן לניהול כל המועמדים, קביעת ראיונות, שליחת הצעות — הכל במקום אחד.'
        : 'A Kanban board to manage all candidates, schedule interviews, send offers — all in one place.',
    },
  ];

  const STATS = [
    { num: '88%', label: isRtl ? 'מועמדים מרוצים' : 'Satisfied candidates' },
    { num: '3x', label: isRtl ? 'מהיר יותר מחיפוש רגיל' : 'Faster than regular search' },
    { num: '+8,500', label: isRtl ? 'משרות פתוחות' : 'Open positions' },
    { num: '+15,000', label: isRtl ? 'מועמדים פעילים' : 'Active candidates' },
  ];

  const FAQ = [
    {
      q: isRtl ? 'האם השירות בחינם?' : 'Is the service free?',
      a: isRtl
        ? 'כן! מועמדים יכולים להשתמש בפלטפורמה ללא עלות. מעסיקים יכולים לפרסם עד 5 משרות בחינם.'
        : 'Yes! Candidates can use the platform at no cost. Employers can post up to 5 jobs for free.',
    },
    {
      q: isRtl ? 'כמה זמן לוקח למצוא עבודה?' : 'How long does it take to find a job?',
      a: isRtl
        ? 'ממוצע של 3–4 שבועות ממועד ההרשמה עד קבלת הצעת עבודה. תלוי בתחום ובזמינות.'
        : 'An average of 3–4 weeks from registration to receiving a job offer. Depends on the field and availability.',
    },
    {
      q: isRtl ? 'איך ה-AI יודע מה מתאים לי?' : 'How does the AI know what suits me?',
      a: isRtl
        ? 'הוא מנתח את כל הפרופיל שלך — ניסיון, כישורים, מיקום ושכר — ומשווה אל מאות פרמטרים בכל משרה.'
        : 'It analyzes your entire profile — experience, skills, location and salary — and compares it against hundreds of parameters in each job.',
    },
    {
      q: isRtl ? 'האם הנתונים שלי מאובטחים?' : 'Is my data secure?',
      a: isRtl
        ? 'בהחלט. כל המידע מוצפן ולא נמכר לצד שלישי. אתה שולט מה גלוי למעסיקים.'
        : 'Absolutely. All data is encrypted and never sold to third parties. You control what is visible to employers.',
    },
  ];

  return (
    <PublicLayout>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white">

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              {isRtl ? 'איך זה עובד?' : 'How does it work?'}
            </span>

            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              {isRtl ? (
                <>פשוט, חכם, יעיל —<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">מוצא לך עבודה</span></>
              ) : (
                <>Simple, smart, effective —<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">finds you a job</span></>
              )}
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {isRtl
                ? 'HeadHunter משלב AI מתקדם עם פשטות השימוש כדי לחבר בין מועמדים לעבודות בדיוק מדהים'
                : 'HeadHunter combines advanced AI with ease of use to connect candidates to jobs with remarkable precision'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="py-10 px-4 border-y border-gray-100 bg-gray-50">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-black text-purple-600 mb-1">{s.num}</p>

                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* For candidates */}
        <div className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>

              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                  {isRtl ? 'למועמדים' : 'For Candidates'}
                </p>

                <h2 className="text-2xl font-black text-gray-900">
                  {isRtl ? 'מוצא עבודה בדרך שלך' : 'Find a job your way'}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {CANDIDATE_STEPS.map((step, i) => (
                <div key={i} className="flex gap-5 items-start bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md">
                    {step.num}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>

                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">{step.time}</span>
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all shadow-lg"
              >
                <UserPlus className="w-4 h-4" />

                {isRtl ? 'התחל לחפש עבודה — בחינם' : 'Start Job Searching — Free'}
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mx-4" />

        {/* For employers */}
        <div className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {isRtl ? 'למעסיקים' : 'For Employers'}
                </p>

                <h2 className="text-2xl font-black text-gray-900">
                  {isRtl ? 'גייס מהר יותר, חכם יותר' : 'Hire faster, smarter'}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {EMPLOYER_STEPS.map((step, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-5 h-5 text-blue-600" />
                  </div>

                  <span className="text-xs font-bold text-blue-500 mb-2 block">
                    {isRtl ? `שלב ${step.num}` : `Step ${step.num}`}
                  </span>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>

                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all shadow-lg"
              >
                <Building2 className="w-4 h-4" />

                {isRtl ? 'פרסם משרה ראשונה — בחינם' : 'Post Your First Job — Free'}
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-center text-gray-900 mb-10">
              {isRtl ? 'שאלות נפוצות' : 'Frequently Asked Questions'}
            </h2>

            <div className="space-y-4">
              {FAQ.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>

                  <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
