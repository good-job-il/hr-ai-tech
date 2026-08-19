import { useTranslation } from 'react-i18next';
import { Sparkles, FileText, Target, TrendingUp, MessageSquare, Shield } from 'lucide-react';

export default function AICareerPage() {
  const { i18n } = useTranslation();

  const isRtl = !i18n.language?.startsWith('en');

  const FEATURES = [
    {
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      title: isRtl ? 'ניתוח קורות חיים ב-AI' : 'AI Resume Analysis',
      desc: isRtl
        ? 'העלה את קורות החיים שלך וקבל ניתוח מעמיק: חוזקות, חולשות, המלצות שיפור ונקודות לחיזוק — הכל תוך שניות.'
        : 'Upload your resume and get a deep analysis: strengths, weaknesses, improvement recommendations — all within seconds.',
    },
    {
      icon: Target,
      color: 'bg-blue-100 text-blue-600',
      title: isRtl ? 'התאמה אישית למשרות' : 'Personalized Job Matching',
      desc: isRtl
        ? 'מנוע ה-AI שלנו סורק אלפי משרות ומדרג אותן לפי ההתאמה האישית שלך — ניסיון, כישורים ורצונות.'
        : 'Our AI engine scans thousands of jobs and ranks them by your personal fit — experience, skills and preferences.',
    },
    {
      icon: MessageSquare,
      color: 'bg-green-100 text-green-600',
      title: isRtl ? 'אימון לראיון עבודה' : 'Interview Coaching',
      desc: isRtl
        ? 'תרגל ראיונות עבודה מול AI שמדמה מגייס אמיתי. קבל משוב על תשובותיך ושפר את הביצועים.'
        : 'Practice job interviews with an AI that simulates a real recruiter. Get feedback on your answers and improve your performance.',
    },
    {
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
      title: isRtl ? 'תכנון מסלול קריירה' : 'Career Path Planning',
      desc: isRtl
        ? 'בהתבסס על הפרופיל שלך, ה-AI ממליץ על מסלולי קריירה, כישורים לפתח, וקורסים רלוונטיים.'
        : 'Based on your profile, AI recommends career paths, skills to develop, and relevant courses.',
    },
    {
      icon: Sparkles,
      color: 'bg-pink-100 text-pink-600',
      title: isRtl ? 'כתיבת מכתב מוטיבציה' : 'Cover Letter Writing',
      desc: isRtl
        ? 'הזן את המשרה שאליה אתה מגיש מועמדות, ו-AI יכתוב לך מכתב מוטיבציה מותאם אישית.'
        : 'Enter the job you are applying for, and AI will write you a personalized cover letter.',
    },
    {
      icon: Shield,
      color: 'bg-indigo-100 text-indigo-600',
      title: isRtl ? 'ניתוח שכר ומשא ומתן' : 'Salary Analysis & Negotiation',
      desc: isRtl
        ? 'קבל נתוני שכר עדכניים לתפקיד ולתחום שלך, וטיפים איך לנהל משא ומתן יעיל על שכר.'
        : 'Get up-to-date salary data for your role and field, plus tips on how to negotiate effectively.',
    },
  ];

  const STEPS = [
    {
      num: '01',
      title: isRtl ? 'הרשם בחינם' : 'Register Free',
      desc: isRtl ? 'צור פרופיל ב-30 שניות' : 'Create a profile in 30 seconds',
    },
    {
      num: '02',
      title: isRtl ? 'העלה קורות חיים' : 'Upload Resume',
      desc: isRtl ? 'או בנה פרופיל ידנית' : 'Or build your profile manually',
    },
    {
      num: '03',
      title: isRtl ? 'ה-AI מנתח' : 'AI Analyzes',
      desc: isRtl ? 'ומצא התאמות מדויקות' : 'And finds precise matches',
    },
    {
      num: '04',
      title: isRtl ? 'קבל עבודה' : 'Get Hired',
      desc: isRtl ? 'ותתקדם בקריירה' : 'And advance your career',
    },
  ];

  const TESTIMONIALS = [
    {
      name: isRtl ? 'דניאל כ.' : 'Daniel K.',
      role: 'Frontend Developer',
      text: isRtl
        ? 'תוך שבוע מצאתי 3 הצעות עבודה רלוונטיות. ה-AI הצליח להתאים אותי למשרות שלא הייתי מוצא לבד.'
        : 'Within a week I found 3 relevant job offers. The AI matched me to jobs I would never have found on my own.',
    },
    {
      name: isRtl ? 'מיכל א.' : 'Michelle A.',
      role: 'Product Manager',
      text: isRtl
        ? 'ניתוח קורות החיים היה מדויק ומועיל. שיפרתי את ה-CV ומיד קיבלתי יותר שיחות מגייסים.'
        : 'The resume analysis was accurate and helpful. I improved my CV and immediately got more recruiter calls.',
    },
    {
      name: isRtl ? 'רון ש.' : 'Ron S.',
      role: 'DevOps Engineer',
      text: isRtl
        ? 'האימון לראיון עזר לי להגיע מוכן. קיבלתי את המשרה שרציתי אחרי הראיון הראשון!'
        : 'The interview coaching helped me arrive prepared. I got the job I wanted after the first interview!',
    },
  ];

  return (
    <PublicLayout>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white">

        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-900 via-purple-700 to-blue-700 text-white py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-20 w-48 h-48 bg-blue-300 rounded-full blur-3xl" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              {isRtl ? 'מופעל על ידי AI מתקדם' : 'Powered by Advanced AI'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
              {isRtl ? (
                <>AI שעובד בשבילך<br /><span className="text-yellow-300">24/7 לאורך כל הקריירה</span></>
              ) : (
                <>AI that works for you<br /><span className="text-yellow-300">24/7 throughout your career</span></>
              )}
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              {isRtl
                ? 'מניתוח קורות חיים, דרך התאמה מדויקת למשרות, ועד אימון לראיונות — HeadHunter AI מלווה אותך בכל שלב.'
                : 'From resume analysis, through precise job matching, to interview coaching — HeadHunter AI guides you every step of the way.'}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/register"
                className="bg-white text-purple-700 font-bold px-8 py-4 rounded-xl hover:bg-purple-50 transition-all shadow-lg text-base"
              >
                {isRtl ? 'התחל בחינם — אין צורך בכרטיס אשראי' : 'Start Free — No Credit Card Required'}
              </Link>
              <Link
                to="/jobs"
                className="bg-white/20 backdrop-blur text-white font-bold px-8 py-4 rounded-xl hover:bg-white/30 transition-all text-base border border-white/30"
              >
                {isRtl ? 'חיפוש משרות' : 'Search Jobs'}
              </Link>
            </div>
            <p className="text-purple-200 text-sm mt-4">
              {isRtl ? '+15,000 מועמדים פעילים כבר משתמשים ב-AI שלנו' : '+15,000 active candidates are already using our AI'}
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-center text-gray-900 mb-12">
              {isRtl ? 'איך זה עובד?' : 'How does it work?'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-lg mx-auto mb-3 shadow-md">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                {isRtl ? 'כל הכלים שתצטרך' : 'All the tools you need'}
              </h2>
              <p className="text-gray-500 text-lg">
                {isRtl ? 'חבילה מלאה של כלי AI לקריירה שלך' : 'A complete package of AI tools for your career'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feat, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-16 px-4 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-10">
              {isRtl ? 'מה אומרים המשתמשים?' : 'What users say'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((item, i) => (
                <div key={i} className={`bg-white rounded-2xl p-6 shadow-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">"{item.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {item.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-gray-400 text-xs">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              {isRtl ? 'מוכן להתחיל?' : 'Ready to start?'}
            </h2>
            <p className="text-gray-500 mb-8">
              {isRtl
                ? 'הצטרף לאלפי מועמדים שכבר מצאו עבודה עם HeadHunter AI'
                : 'Join thousands of candidates who have already found a job with HeadHunter AI'}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-10 py-4 rounded-xl hover:opacity-90 transition-all shadow-lg text-lg"
            >
              <Sparkles className="w-5 h-5" />
              {isRtl ? 'הרשמה חינמית' : 'Free Registration'}
            </Link>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
