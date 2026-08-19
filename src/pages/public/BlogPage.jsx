import { useTranslation } from 'react-i18next';

export default function BlogPage() {
  const { i18n } = useTranslation();

  const isRtl = !i18n.language?.startsWith('en');

  const POSTS = [
    {
      id: 1,
      category: isRtl ? 'AI וגיוס' : 'AI & Recruitment',
      title: isRtl ? 'כיצד AI משנה את עולם הגיוס בישראל' : 'How AI is transforming recruitment in Israel',
      excerpt: isRtl
        ? 'טכנולוגיות בינה מלאכותית מחוללות מהפכה בדרך שבה חברות מגייסות עובדים — ממיון קורות חיים ועד ראיונות חכמים.'
        : 'Artificial intelligence technologies are revolutionizing the way companies recruit — from CV screening to smart interviews.',
      author: isRtl ? 'יאיר לוי' : 'Yair Levy',
      date: isRtl ? 'מאי 2025' : 'May 2025',
      readTime: isRtl ? '5 דק׳' : '5 min',
      color: 'from-purple-500 to-blue-500',
    },
    {
      id: 2,
      category: isRtl ? 'טיפים למועמד' : 'Candidate Tips',
      title: isRtl ? '10 טעויות נפוצות בקורות חיים שמובילות לדחייה' : '10 common resume mistakes that lead to rejection',
      excerpt: isRtl
        ? 'מה הגיוסים באמת מחפשים? חשפנו את הטעויות הנפוצות ביותר שגורמות לקורות חיים להיזרק לפח — ואיך להימנע מהן.'
        : "What are recruiters really looking for? We exposed the most common mistakes that get resumes thrown in the bin — and how to avoid them.",
      author: isRtl ? 'מיכל אבני' : 'Michal Avni',
      date: isRtl ? 'אפריל 2025' : 'April 2025',
      readTime: isRtl ? '7 דק׳' : '7 min',
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 3,
      category: isRtl ? 'שוק העבודה' : 'Job Market',
      title: isRtl ? 'דוח שוק ההייטק הישראלי — Q1 2025' : 'Israeli High-Tech Market Report — Q1 2025',
      excerpt: isRtl
        ? 'נתונים עדכניים על שכר, דרישות, וטרנדים מרכזיים בשוק ההייטק הישראלי לרבעון הראשון של 2025.'
        : 'Up-to-date data on salaries, requirements, and key trends in the Israeli high-tech market for Q1 2025.',
      author: isRtl ? 'צוות HeadHunter' : 'HeadHunter Team',
      date: isRtl ? 'אפריל 2025' : 'April 2025',
      readTime: isRtl ? '10 דק׳' : '10 min',
      color: 'from-green-500 to-teal-500',
    },
    {
      id: 4,
      category: isRtl ? 'ראיון עבודה' : 'Job Interview',
      title: isRtl ? 'המדריך המלא לראיון עבודה טכני' : 'The complete guide to a technical job interview',
      excerpt: isRtl
        ? 'איך מתכוננים לראיון טכני? מה שואלים? איך עונים על שאלות אלגוריתמים? כל מה שצריך לדעת לפני הראיון.'
        : 'How to prepare for a technical interview? What do they ask? How to answer algorithm questions? Everything you need to know before the interview.',
      author: isRtl ? 'דניאל כהן' : 'Daniel Cohen',
      date: isRtl ? 'מרץ 2025' : 'March 2025',
      readTime: isRtl ? '12 דק׳' : '12 min',
      color: 'from-orange-500 to-amber-500',
    },
    {
      id: 5,
      category: isRtl ? 'קריירה' : 'Career',
      title: isRtl ? 'מתי הזמן הנכון להחליף עבודה?' : 'When is the right time to change jobs?',
      excerpt: isRtl
        ? 'סימנים שאומרים שהגיע הזמן לצעד הבא. איך מנתחים את המצב הנוכחי ומחליטים בצורה חכמה.'
        : 'Signs that say it is time for the next step. How to analyze your current situation and make a smart decision.',
      author: isRtl ? 'שרה גולן' : 'Sarah Golan',
      date: isRtl ? 'מרץ 2025' : 'March 2025',
      readTime: isRtl ? '6 דק׳' : '6 min',
      color: 'from-indigo-500 to-violet-500',
    },
    {
      id: 6,
      category: isRtl ? 'למעסיקים' : 'For Employers',
      title: isRtl ? 'איך לגייס מועמדים טובים יותר בפחות זמן' : 'How to hire better candidates in less time',
      excerpt: isRtl
        ? 'אסטרטגיות מוכחות לשיפור תהליך הגיוס, קיצור זמן האיוש, ושיפור חווית המועמד.'
        : 'Proven strategies to improve the recruitment process, reduce time-to-fill, and enhance the candidate experience.',
      author: isRtl ? 'רון שפירא' : 'Ron Shapira',
      date: isRtl ? 'פברואר 2025' : 'February 2025',
      readTime: isRtl ? '8 דק׳' : '8 min',
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  const CATEGORIES = isRtl
    ? ['הכל', 'AI וגיוס', 'טיפים למועמד', 'שוק העבודה', 'ראיון עבודה', 'קריירה', 'למעסיקים']
    : ['All', 'AI & Recruitment', 'Candidate Tips', 'Job Market', 'Job Interview', 'Career', 'For Employers'];

  const allLabel = isRtl ? 'הכל' : 'All';

  return (
    <PublicLayout>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-purple-50/40 to-white">

        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              {isRtl ? 'הבלוג של HeadHunter' : 'HeadHunter Blog'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              {isRtl ? (
                <>תובנות, טיפים ומגמות<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">מעולם הקריירה</span></>
              ) : (
                <>Insights, tips and trends<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">from the world of careers</span></>
              )}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {isRtl
                ? 'מאמרים מקצועיים, עצות שוות, ונתונים עדכניים על שוק העבודה הישראלי'
                : 'Professional articles, valuable advice, and up-to-date data on the Israeli job market'}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  cat === allLabel
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured post */}
          <div className="mb-10 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white flex flex-col md:flex-row">
            <div className={`bg-gradient-to-br ${POSTS[0].color} md:w-2/5 min-h-[200px] flex items-center justify-center`}>
              <span className="text-6xl">✍️</span>
            </div>
            <div className="p-8 flex flex-col justify-center md:w-3/5">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
                {POSTS[0].category} · {isRtl ? 'מאמר מומלץ' : 'Featured Article'}
              </span>
              <h2 className="text-2xl font-black text-gray-900 mb-3">{POSTS[0].title}</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">{POSTS[0].excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{POSTS[0].author}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{POSTS[0].readTime}</span>
                <span>{POSTS[0].date}</span>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POSTS.slice(1).map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group">
                <div className={`bg-gradient-to-br ${post.color} h-36 flex items-center justify-center`}>
                  <span className="text-4xl opacity-80">📝</span>
                </div>
                <div className="p-5">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{post.category}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1 mb-2 group-hover:text-purple-700 transition-colors leading-snug">{post.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime} · {post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-black mb-2">
              {isRtl ? 'קבל עדכונים ישירות למייל' : 'Get updates directly to your email'}
            </h3>
            <p className="text-purple-100 mb-6">
              {isRtl
                ? 'הירשם לניוזלטר ותקבל מאמרים, נתוני שוק וטיפים פעם בשבוע'
                : 'Subscribe to the newsletter and receive articles, market data and tips once a week'}
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={isRtl ? 'האימייל שלך' : 'Your email'}
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none"
                dir="ltr"
              />
              <button className="bg-white text-purple-700 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors text-sm">
                {isRtl ? 'הירשם' : 'Subscribe'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
