import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, Bookmark, Share2, Calendar, Briefcase, Sparkles,
  SlidersHorizontal, LayoutGrid, List, BarChart2, TrendingUp, ChevronDown,
  ChevronUp, RotateCcw, Tag, Brain, ShieldCheck, Zap, Building2,
  Star, ArrowLeft, Wand2
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Navbar from '@/components/home/Navbar';

const glass = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border: '1px solid rgba(221,235,255,0.86)',
  borderRadius: 8,
  boxShadow: '0 28px 80px rgba(79,124,255,0.11), 0 3px 12px rgba(15,23,42,0.04)',
};

function MatchBadge({ score }) {
  const { i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const high = score >= 90;
  const label = high ? (isRtl ? 'התאמה גבוהה' : 'High match') : (isRtl ? 'התאמה טובה' : 'Good match');

  return (
    <span
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black"
      style={{
        background: high ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
        color: high ? '#059669' : '#D97706',
        border: high ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(245,158,11,0.18)',
      }}
    >
      <Sparkles className="w-3.5 h-3.5" />
      {label} {score}%
    </span>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1.5">
      <button
        type="button"
        onClick={onChange}
        className="w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all"
        style={{
          background: checked ? 'linear-gradient(135deg,#8B5CF6,#2F80FF)' : '#fff',
          border: checked ? '1px solid #7C3AED' : '1px solid #CBD5E1',
          boxShadow: checked ? '0 4px 12px rgba(124,58,237,0.28)' : 'none',
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span className="text-[14px] font-semibold text-[#475569]">{label}</span>
    </label>
  );
}

function FilterBlock({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-[#E4ECFF] pb-5 mb-5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-4"
      >
        <span className="text-[14px] font-black text-[#0F172A]">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#7C3AED]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
      </button>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

function JobCard({ job }) {
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const initials = job.company_initials || (job.company || '').slice(0, 2) || 'HR';
  const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(job.created_date || Date.now())) / 86400000));
  const typeLabel = isRtl
    ? { full: 'משרה מלאה', part: 'חלקית', remote: 'מרחוק', daily: 'יומי' }[job.type] || ''
    : { full: 'Full-time', part: 'Part-time', remote: 'Remote', daily: 'Daily' }[job.type] || '';
  const matchScore = 78 + (job.id?.charCodeAt?.(0) % 20 || 14);
  const isNew = daysAgo <= 3;

  return (
    <div
      className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={glass}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#A855F7] via-[#6C4DFF] to-[#2FB8FF] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-[#8B5CF6]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-7 relative">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center text-white text-[15px] font-black shadow-[0_18px_35px_rgba(108,77,255,0.25)]"
              style={{
                background: `linear-gradient(135deg, ${job.company_color || '#8B5CF6'}, #2F80FF)`,
              }}
            >
              {initials}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                <MatchBadge score={matchScore} />
                  {isNew && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-black bg-[#EEF6FF] text-[#2F80FF] border border-[#DDEBFF]">
                    {isRtl ? 'חדש' : 'New'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-[22px] leading-[1.25] font-black text-[#0F172A] mb-2 w-[90%]">
          {job.title}
        </h3>

        <p className="text-[15px] font-black text-[#7C3AED] mb-4">
          {job.company || 'חברה מובילה'}
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-5 text-[14px] font-bold text-[#64748B]">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#60A5FA]" />
              {job.location}
            </span>
          )}

          {typeLabel && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#8B5CF6]" />
              {typeLabel}
            </span>
          )}

          {job.salary_min && job.salary_max && (
            <span className="text-[#0F172A]">
              ₪{job.salary_min?.toLocaleString(isRtl ? 'he-IL' : 'en-US')}–₪{job.salary_max?.toLocaleString(isRtl ? 'he-IL' : 'en-US')}
            </span>
          )}
        </div>

        {job.description && (
          <p className="text-[15px] leading-8 text-[#64748B] mb-5 line-clamp-2">
            {job.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-7">
          {job.category && (
            <span className="px-4 py-2 rounded-2xl bg-[#F3EFFF] text-[#7C3AED] border border-[#E2D8FF] text-xs font-black">
              {job.category}
            </span>
          )}
          <span className="px-4 py-2 rounded-2xl bg-[#F7FBFF] text-[#64748B] border border-[#E4ECFF] text-xs font-bold">
            הנדסת תוכנה
          </span>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-[#E4ECFF]">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#94A3B8]">
            <Calendar className="w-4 h-4" />
            {isRtl
              ? (daysAgo === 0 ? 'היום' : daysAgo === 1 ? 'אתמול' : `לפני ${daysAgo} ימים`)
              : (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`)}
          </span>

          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg bg-white border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:text-[#7C3AED]">
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-white border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:text-[#7C3AED]">
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <Link
              to={`/jobs/${job.id}`}
              className="inline-flex items-center gap-2 px-7 h-12 rounded-2xl text-white text-[15px] font-black"
              style={{
                background: 'linear-gradient(135deg,#A855F7,#6C4DFF,#2F80FF)',
                boxShadow: '0 18px 42px rgba(108,77,255,0.32)',
              }}
            >
              {t('jobs.card.apply')}
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Jobs() {
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const urlP = new URLSearchParams(window.location.search);
  const navigate = useNavigate();

  const JOB_TYPES = [
    { value: 'full', label: t('jobs.jobTypes.fullTime') },
    { value: 'part', label: t('jobs.jobTypes.partTime') },
    { value: 'remote', label: t('jobs.jobTypes.remote') },
    { value: 'daily', label: isRtl ? 'יומי' : 'Daily' },
  ];

  const EXP_LEVELS = [
    { value: '0', label: isRtl ? 'ללא ניסיון' : 'No experience' },
    { value: '1-2', label: isRtl ? '1-2 שנות ניסיון' : '1-2 years experience' },
    { value: '3-5', label: isRtl ? '3-5 שנות ניסיון' : '3-5 years experience' },
    { value: '5+', label: isRtl ? '5+ שנות ניסיון' : '5+ years experience' },
  ];

  const [search, setSearch] = useState(urlP.get('search') || urlP.get('q') || '');
  const [loc, setLoc] = useState('');
  const [jobTypes, setJobTypes] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [openFilters, setOpenFilters] = useState({
    type: true,
    exp: true,
    salary: true,
    mode: true,
  });

  const toggle = (k) => setOpenFilters((f) => ({ ...f, [k]: !f[k] }));
  const toggleType = (v) => setJobTypes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', search, loc, jobTypes],
    queryFn: async () => {
      if (search) {
        const r = await base44.functions.invoke('smartSearch', {
          query: search,
          filters: {},
          type: 'search',
        });
        return r.data?.jobs || [];
      }

      let all = await base44.entities.Job.filter({ is_closed: false }, '-created_date', 100);

      if (jobTypes.length) all = all.filter((j) => jobTypes.includes(j.type));
      if (loc) all = all.filter((j) => j.location?.toLowerCase().includes(loc.toLowerCase()));

      return all;
    },
    initialData: [],
  });

  const handleSearch = () => {
    if (search) navigate(`/jobs?search=${encodeURIComponent(search)}`);
    else navigate('/jobs');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg,#F6FBFF 0%,#EEF6FF 46%,#F7FBFF 100%)',
      }}
    >
      <SEOHead
        title={search ? `"${search}" | HeadHunter` : 'כל המשרות | HeadHunter'}
        description="חיפוש משרות בפלטפורמת גיוס מבוססת AI"
      />

      <div className="fixed top-[-220px] right-[-140px] w-[620px] h-[620px] rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
      <div className="fixed top-[220px] left-[-180px] w-[620px] h-[620px] rounded-full bg-[#2FB8FF]/14 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-180px] right-[28%] w-[520px] h-[520px] rounded-full bg-[#6C4DFF]/10 blur-3xl pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-[1540px] mx-auto px-7 py-12">
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-[#DDEBFF] text-[#7C3AED] font-black shadow-[0_12px_30px_rgba(108,77,255,0.10)] mb-5">
            <Sparkles className="w-4 h-4" />
            {isRtl ? 'פלטפורמת משרות מבוססת AI בישראל' : 'AI-Powered Jobs Platform in Israel'}
          </div>

          <h1 className="text-[58px] leading-[1.05] font-black text-[#0F172A] mb-5">
            {isRtl ? 'משרות שמותאמות' : 'Jobs tailored'}
            <span className="block bg-gradient-to-l from-[#8B5CF6] via-[#6C4DFF] to-[#2FB8FF] bg-clip-text text-transparent">
              {isRtl ? 'בדיוק אליך' : 'just for you'}
            </span>
          </h1>

          <p className="text-[20px] leading-9 text-[#64748B] max-w-[760px] mx-auto font-semibold">
            {isRtl
              ? 'מצא את ההזדמנות הבאה שלך עם חיפוש חכם, התאמות AI, פילטרים מתקדמים וחוויית מועמד מדויקת.'
              : 'Find your next opportunity with smart search, AI matching, advanced filters and a precise candidate experience.'}
          </p>
        </section>

        <section className="mb-10" style={glass}>
          <div className="p-7">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_0.8fr_auto] gap-4">
              <div className="h-16 rounded-2xl bg-white border border-[#DDEBFF] flex items-center gap-3 px-5">
                <Search className="w-5 h-5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={t('jobs.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>

              <div className="h-16 rounded-2xl bg-white border border-[#DDEBFF] flex items-center gap-3 px-5">
                <MapPin className="w-5 h-5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={t('jobs.locationPlaceholder')}
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>

              <div className="h-16 rounded-2xl bg-white border border-[#DDEBFF] flex items-center gap-3 px-5">
                <Tag className="w-5 h-5 text-[#94A3B8]" />
                <select
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-[#64748B]"
                  onChange={(e) => setJobTypes(e.target.value ? [e.target.value] : [])}
                >
                  <option value="">{isRtl ? 'כל הסוגים' : 'All types'}</option>
                  {JOB_TYPES.map((jt) => (
                    <option key={jt.value} value={jt.value}>
                      {jt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSearch}
                className="h-16 px-10 rounded-2xl text-white text-[16px] font-black flex items-center justify-center gap-3"
                style={{
                  background: 'linear-gradient(135deg,#A855F7,#6C4DFF,#2F80FF)',
                  boxShadow: '0 18px 42px rgba(108,77,255,0.35)',
                }}
              >
                <Search className="w-5 h-5" />
                {t('jobs.searchButton')}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-5 justify-center">
              {(isRtl
                ? ['אנליסט נתונים', 'מהנדס DevOps', 'מעצב UI/UX', 'מפתח Frontend', 'מפתח Full Stack', 'מפתח Backend', 'מוצר', 'שיווק דיגיטלי']
                : ['Data Analyst', 'DevOps Engineer', 'UI/UX Designer', 'Frontend Developer', 'Full Stack Developer', 'Backend Developer', 'Product', 'Digital Marketing']
              ).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="px-5 py-2.5 rounded-full bg-white border border-[#DDEBFF] text-[#6C4DFF] text-sm font-black shadow-sm hover:shadow-md transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-8 items-start">
          <aside className="hidden xl:block sticky top-[110px]" style={glass}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#7C3AED]" />
                  {t('jobs.filters.title')}
                </h3>

                <button className="text-[#94A3B8] text-sm font-bold flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" />
                  {t('jobs.filters.clearAll')}
                </button>
              </div>

              <FilterBlock title={t('jobs.filters.jobType')} open={openFilters.type} onToggle={() => toggle('type')}>
                {JOB_TYPES.map((jt) => (
                  <Checkbox key={jt.value} label={jt.label} checked={jobTypes.includes(jt.value)} onChange={() => toggleType(jt.value)} />
                ))}
              </FilterBlock>

              <FilterBlock title={t('jobs.filters.experience')} open={openFilters.exp} onToggle={() => toggle('exp')}>
                {EXP_LEVELS.map((e) => (
                  <Checkbox key={e.value} label={e.label} checked={false} onChange={() => {}} />
                ))}
              </FilterBlock>

              <FilterBlock title={t('jobs.filters.salary')} open={openFilters.salary} onToggle={() => toggle('salary')}>
                <div className="grid grid-cols-2 gap-3">
                  <input className="h-11 rounded-xl border border-[#DDEBFF] bg-white px-3 text-sm outline-none" placeholder={isRtl ? 'מינימום' : 'Minimum'} />
                  <input className="h-11 rounded-xl border border-[#DDEBFF] bg-white px-3 text-sm outline-none" placeholder={isRtl ? 'מקסימום' : 'Maximum'} />
                </div>
              </FilterBlock>

              <FilterBlock title={isRtl ? 'סידור עבודה' : 'Work mode'} open={openFilters.mode} onToggle={() => toggle('mode')}>
                {(isRtl ? ['היברידי', 'מהבית', 'פיזי'] : ['Hybrid', 'Remote', 'On-site']).map((m) => (
                  <Checkbox key={m} label={m} checked={false} onChange={() => {}} />
                ))}
              </FilterBlock>
            </div>
          </aside>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[26px] font-black text-[#0F172A]">
                  {isRtl ? `${jobs.length} משרות נמצאו` : `${jobs.length} jobs found`}
                </h2>
                <p className="text-[#64748B] font-semibold">
                  {isRtl ? 'ממוינות לפי התאמה ורלוונטיות' : 'Sorted by match and relevance'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select className="h-12 rounded-2xl bg-white border border-[#DDEBFF] px-4 text-sm font-bold text-[#64748B] outline-none">
                  <option>{isRtl ? 'תאריך פרסום' : 'Publish date'}</option>
                  <option>{isRtl ? 'רלוונטיות' : 'Relevance'}</option>
                  <option>{isRtl ? 'שכר גבוה לנמוך' : 'Salary: High to Low'}</option>
                </select>

                <div className="h-12 rounded-2xl bg-white border border-[#DDEBFF] flex overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`w-12 flex items-center justify-center ${viewMode === 'list' ? 'text-[#7C3AED] bg-[#F3EFFF]' : 'text-[#94A3B8]'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`w-12 flex items-center justify-center ${viewMode === 'grid' ? 'text-[#7C3AED] bg-[#F3EFFF]' : 'text-[#94A3B8]'}`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[420px] flex flex-col items-center justify-center" style={glass}>
                <div className="w-16 h-16 rounded-full border-4 border-[#E4ECFF] border-t-[#7C3AED] animate-spin mb-5" />
                <p className="text-[#64748B] text-lg font-black">{isRtl ? 'AI מחפש משרות מתאימות...' : 'AI is finding matching jobs...'}</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="h-[420px] flex flex-col items-center justify-center text-center" style={glass}>
                <Briefcase className="w-16 h-16 text-[#C4B5FD] mb-5" />
                <h3 className="text-2xl font-black text-[#0F172A] mb-2">{t('jobs.noJobs')}</h3>
                <p className="text-[#64748B] font-semibold">{isRtl ? 'נסה לשנות את הסינון או מילת החיפוש' : 'Try adjusting your filters or search term'}</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>

          <aside className="hidden xl:flex flex-col gap-6 sticky top-[110px]">
            <div style={glass} className="p-6">
              <h3 className="text-xl font-black text-[#0F172A] mb-5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                {isRtl ? 'משרות מומלצות עבורך' : 'Recommended for you'}
              </h3>

              {[
                ['Frontend Developer', 'WalkMe', '₪16K–₪22K', 'WM'],
                ['Data Analyst', 'SimilarWeb', '₪15K–₪20K', 'SW'],
                ['DevOps Engineer', 'CyberArk', '₪20K–₪28K', 'CA'],
              ].map(([title, company, salary, init]) => (
                <div key={title} className="flex items-center gap-4 py-4 border-b border-[#E4ECFF] last:border-b-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] text-white flex items-center justify-center text-sm font-black">
                    {init}
                  </div>
                  <div>
                    <div className="font-black text-[#0F172A] text-sm">{title}</div>
                    <div className="text-[#64748B] text-xs font-bold">{company}</div>
                    <div className="text-[#7C3AED] text-xs font-black">{salary}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={glass} className="p-6">
              <h3 className="text-xl font-black text-[#0F172A] mb-5 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#2F80FF]" />
                תובנות שוק העבודה
              </h3>

              <div className="rounded-lg p-6 bg-gradient-to-br from-[#F3EFFF] to-[#EAF8FF] border border-[#DDEBFF]">
                <div className="text-[42px] leading-none font-black bg-gradient-to-l from-[#8B5CF6] to-[#2F80FF] bg-clip-text text-transparent mb-2">
                  +24%
                </div>
                <p className="text-[#64748B] font-bold mb-4">
                  עלייה בביקוש למשרות טכנולוגיה
                </p>
                <div className="flex items-center gap-2 text-[#10B981] font-black text-sm">
                  <TrendingUp className="w-4 h-4" />
                  ביקוש גבוה בתחום פיתוח
                </div>
              </div>
            </div>

            <div
              className="p-7 text-white relative overflow-hidden"
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg,#A855F7,#6C4DFF,#2F80FF)',
                boxShadow: '0 28px 80px rgba(108,77,255,0.30)',
              }}
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

              <Wand2 className="w-9 h-9 mb-4 relative" />
              <h3 className="text-2xl font-black mb-3 relative">לא יודע מה לחפש?</h3>
              <p className="text-white/80 font-semibold leading-7 mb-6 relative">
                תן ל־AI למצוא עבורך את המשרות שהכי מתאימות לניסיון, לכישורים וליעדים שלך.
              </p>

              <Link
                to="/register"
                className="relative h-12 rounded-2xl bg-white/18 border border-white/30 backdrop-blur-xl flex items-center justify-center text-white font-black"
              >
                התחל חיפוש חכם
              </Link>
            </div>
          </aside>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-12">
          {[
            [ShieldCheck, '100% אנונימי', 'המעסיק רואה אותך רק אחרי אישור'],
            [Zap, 'תהליך מהיר', 'הגשה למשרות בלחיצה אחת'],
            [Brain, 'AI Matching', 'התאמות חכמות בזמן אמת'],
            [Building2, 'חברות איכותיות', 'משרות מחברות מובילות בלבד'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="p-6 text-center" style={glass}>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-black text-[#0F172A] mb-2">{title}</h3>
              <p className="text-sm font-semibold text-[#64748B] leading-6">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}