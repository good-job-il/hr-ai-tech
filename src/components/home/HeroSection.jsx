import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicJobService } from '@/api/services/publicJobService';
import { companyService } from '@/api/services/companyService';
import { Sparkles } from 'lucide-react';

export default function HeroSection() {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');

  const { data: jobs = [] } = useQuery({
    queryKey: ['hero-jobs-count'],
    queryFn: async () => {
      return publicJobService.list({ is_closed: false, sort: 'created_date', order: 'DESC', limit: 500 });
    },
    staleTime: 1000 * 60 * 5,
  });
  const { data: companies = [] } = useQuery({
    queryKey: ['hero-companies-count'],
    queryFn: () => companyService.list({ sort: 'created_date', order: 'DESC', limit: 50 }),
    staleTime: 1000 * 60 * 5,
  });
  const users = [];

  const jobCount = jobs.length;
  const companyCount = Math.max(companies.length, 1);
  const userCount = Math.max(users.length, 1);

  const handleSubmit = () => {
    if (!phone.trim()) return;
    navigate(`/register?phone=${encodeURIComponent(phone)}`);
  };

  const handleStatClick = (path) => {
    navigate(path);
  };

  const locale = isRtl ? 'he-IL' : 'en-US';

  return (
    <div
      className="relative min-h-screen md:min-h-[680px] flex items-center overflow-hidden pt-8 md:pt-16 pb-12 md:pb-20 bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Soft glow orbs */}
      <div className="absolute top-20 -right-40 w-96 h-96 bg-purple-400/8 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-blue-400/8 blur-3xl rounded-full" style={{ animation: 'pulse 4s ease-in-out infinite' }}></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-300/6 blur-3xl rounded-full" style={{ animation: 'pulse 5s ease-in-out infinite 1s' }}></div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex flex-col items-center text-center relative z-10">
        <div className="max-w-[580px] w-full">
           <div className="inline-block mb-8 px-4 py-2.5 rounded-full bg-blue-100 border border-blue-200 backdrop-blur-sm hover:border-blue-300 transition-colors">
             <p className="text-blue-700 text-xs font-semibold flex items-center justify-center gap-2.5">
              <Sparkles className="w-3.5 h-3.5" /> {t('home.poweredByAI')}
             </p>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight text-gray-900">
            {t('home.hero.title')}
          </h1>

          <p className="text-gray-600 text-lg md:text-xl mb-10 leading-relaxed">{t('home.hero.subtitle')}</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              type="tel"
              placeholder={t('home.hero.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="bg-white border border-blue-100 text-gray-900 text-base h-14 rounded-lg flex-1 px-5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400"
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            <button onClick={handleSubmit} className="bg-gradient-to-r from-[#7C4DFF] to-[#4F7CFF] hover:from-[#6B3EEE] hover:to-[#4070EE] text-white h-14 px-8 text-base font-bold rounded-lg whitespace-nowrap transition-all shadow-lg hover:shadow-xl active:scale-95">
              {t('home.hero.searchButton')}
            </button>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            {t('home.hero.termsNote')} <span className="text-blue-600 cursor-pointer hover:text-blue-700">{t('home.hero.termsLink')}</span> {t('home.hero.andText')}<span className="text-blue-600 cursor-pointer hover:text-blue-700">{t('home.hero.privacyLink')}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 md:mt-24 w-full max-w-2xl">
           <button
             onClick={() => handleStatClick('/my-profile')}
             className="group hover:scale-105 active:scale-95 transition-all cursor-pointer bg-white border border-blue-100 rounded-2xl px-6 py-6 hover:shadow-lg hover:border-blue-300 min-h-28"
           >
             <div className="text-3xl font-bold text-blue-600">{userCount.toLocaleString(locale)}</div>
             <div className="text-gray-600 text-sm mt-3 font-medium">{t('home.stats.activeCandidates')}</div>
           </button>
           <button
             onClick={() => handleStatClick('/jobs')}
             className="group hover:scale-105 active:scale-95 transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl px-6 py-6 hover:shadow-lg hover:border-purple-400 relative min-h-28"
           >
             <div className={`absolute -top-4 ${isRtl ? '-right-4' : '-left-4'} bg-gradient-to-r from-[#7C4DFF] to-[#4F7CFF] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 flex-row-reverse shadow-lg`}>
               <Sparkles className="w-4 h-4" />
               {t('home.stats.openJobs')}
             </div>
             <div className="text-3xl font-bold text-purple-600">{jobCount.toLocaleString(locale)}</div>
             <div className="text-gray-600 text-sm mt-3 font-medium">{t('home.stats.jobs')}</div>
           </button>
           <button
             onClick={() => handleStatClick('/companies')}
             className="group hover:scale-105 active:scale-95 transition-all cursor-pointer bg-white border border-blue-100 rounded-2xl px-6 py-6 hover:shadow-lg hover:border-blue-300 min-h-28"
           >
             <div className="text-3xl font-bold text-blue-600">{companyCount.toLocaleString(locale)}</div>
             <div className="text-gray-600 text-sm mt-3 font-medium">{t('home.stats.hiringCompanies')}</div>
           </button>
         </div>
      </div>
    </div>
  );
}
