import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Menu, X, LogOut, Search,
  MessageCircle, TrendingUp, ChevronDown, ChevronUp, Download,
  Bell, Sparkles, Home, Settings
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';

const LOGO = '/headhunter-logo.png';

const NAV_ITEMS_HE = [
  { label: 'דשבורד', path: '/employer/dashboard', icon: LayoutDashboard },
  { label: 'דשבורד גיוס', path: '/employer/recruitment', icon: TrendingUp },
  { label: 'משרות', path: '/employer/jobs', icon: Briefcase },
  {
    label: 'מועמדים',
    icon: Users,
    submenu: [
      { label: 'רשימת מועמדים', path: '/employer/candidates' },
      { label: 'ייבוא מועמדים', path: '/employer/candidate-import', icon: Download },
    ]
  },
  { label: 'הודעות', path: '/employer/messages', icon: MessageCircle },
  { label: 'הגדרות', path: '/employer/settings', icon: Settings },
];

const NAV_ITEMS_EN = [
  { label: 'Dashboard', path: '/employer/dashboard', icon: LayoutDashboard },
  { label: 'Recruitment', path: '/employer/recruitment', icon: TrendingUp },
  { label: 'Jobs', path: '/employer/jobs', icon: Briefcase },
  {
    label: 'Candidates',
    icon: Users,
    submenu: [
      { label: 'Candidate List', path: '/employer/candidates' },
      { label: 'Import Candidates', path: '/employer/candidate-import', icon: Download },
    ]
  },
  { label: 'Messages', path: '/employer/messages', icon: MessageCircle },
  { label: 'Settings', path: '/employer/settings', icon: Settings },
];

export default function EmployerLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const navItems = isEn ? NAV_ITEMS_EN : NAV_ITEMS_HE;
  const dir = isEn ? 'ltr' : 'rtl';

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex text-[#0F172A]" dir={dir}>
      <aside className={`fixed inset-y-0 z-40 w-[280px] bg-white/82 backdrop-blur-2xl flex flex-col transform transition-transform
        ${isEn
          ? `left-0 border-r border-[#DDEBFF] shadow-[0_30px_90px_rgba(79,124,255,0.12)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`
          : `right-0 border-l border-[#DDEBFF] shadow-[0_30px_90px_rgba(79,124,255,0.12)] ${mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`
        }`}>
        <Link to="/" className="h-[96px] px-6 border-b border-[#E4ECFF] flex items-center justify-center">
          <img src={LOGO} alt="HeadHunter HR-Tech" className="h-[58px] w-auto object-contain" />
        </Link>

        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const hasSubmenu = item.submenu?.length > 0;
            const isSubmenuOpen = expandedSubmenu === item.label;
            const isActive = item.path
              ? location.pathname === item.path
              : item.submenu?.some(sub => location.pathname === sub.path);

            if (hasSubmenu) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpandedSubmenu(isSubmenuOpen ? null : item.label)}
                    className={[
                      'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                      isActive
                        ? `${isEn ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] text-white shadow-[0_16px_38px_rgba(108,77,255,0.28)]`
                        : 'text-[#64748B] hover:bg-[#F1F6FF] hover:text-[#6C4DFF]'
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {isSubmenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isSubmenuOpen && (
                    <div className={`mt-2 space-y-1 border-[#E4ECFF] ${isEn ? 'ml-4 pl-3 border-l' : 'mr-4 pr-3 border-r'}`}>
                      {item.submenu.map((subitem) => {
                        const subActive = location.pathname === subitem.path;
                        const SubIcon = subitem.icon;
                        return (
                          <Link
                            key={subitem.path}
                            to={subitem.path}
                            onClick={() => setMobileOpen(false)}
                            className={[
                              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
                              subActive
                                ? 'bg-[#EEF4FF] text-[#6C4DFF]'
                                : 'text-[#64748B] hover:bg-[#F7FBFF] hover:text-[#6C4DFF]'
                            ].join(' ')}
                          >
                            {SubIcon && <SubIcon className="w-4 h-4" />}
                            {subitem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                  active
                    ? `${isEn ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] text-white shadow-[0_16px_38px_rgba(108,77,255,0.28)]`
                    : 'text-[#64748B] hover:bg-[#F1F6FF] hover:text-[#6C4DFF]'
                ].join(' ')}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E4ECFF]">
          <div className="rounded-lg p-5 bg-gradient-to-br from-[#F5F0FF] to-[#EAF8FF] border border-[#DDEBFF] shadow-[0_20px_50px_rgba(108,77,255,0.12)] mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#0F172A] font-black text-sm">{isEn ? 'AI for Employers' : 'AI למעסיקים'}</div>
                <div className="text-[#64748B] text-xs">{isEn ? 'Smart candidate matching' : 'התאמת מועמדים חכמה'}</div>
              </div>
            </div>
            <Link to="/employer/recruitment" className={`h-10 rounded-xl ${isEn ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-[#2F80FF] to-[#8B5CF6] text-white text-sm font-black flex items-center justify-center`}>
              {isEn ? 'Open Recruitment Dashboard' : 'כניסה לדשבורד גיוס'}
            </Link>
          </div>

          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[#64748B] hover:bg-[#F1F6FF]">
            <Home className="w-4 h-4" /> {isEn ? 'Back to site' : 'חזרה לאתר'}
          </Link>

          <button
            onClick={() => base44.auth.logout('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[#64748B] hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="w-4 h-4" /> {isEn ? 'Sign out' : 'יציאה'}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`flex-1 min-h-screen flex flex-col ${isEn ? 'md:ml-[280px]' : 'md:mr-[280px]'}`}>
        <header className="sticky top-0 z-30 h-16 md:h-[72px] lg:h-[88px] bg-white/70 backdrop-blur-2xl border-b border-white/60 shadow-sm px-4 md:px-6 lg:px-8 flex items-center justify-between" style={{ boxShadow: '0 1px 0 rgba(220,235,255,0.8), 0 4px 24px rgba(79,124,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/80 transition" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5 text-[#64748B]" /> : <Menu className="w-5 h-5 text-[#64748B]" />}
            </button>

            {/* Avatar with gradient border */}
            <div className="hidden md:flex items-center gap-3">
              <div className="p-[2px] rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] shadow-[0_0_0_3px_rgba(139,92,246,0.15)]">
                <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] text-white flex items-center justify-center font-black text-lg">
                  {isEn ? 'E' : 'מ'}
                </div>
              </div>
              <div>
                <div className="font-black text-[#0F172A] text-sm leading-tight">{isEn ? 'Hello, Manager' : 'שלום, מנהל'}</div>
                <div className="text-xs text-[#94A3B8] font-medium">{isEn ? 'Employer Area' : 'אזור מעסיק'}</div>
              </div>
            </div>

            {/* Notification bell would go here */}
          </div>

          {/* Rounded-full search */}
          <div className="hidden lg:flex items-center gap-3 w-[380px] h-11 rounded-full bg-white/80 border border-white/70 px-5 shadow-sm backdrop-blur-xl" style={{ boxShadow: '0 2px 12px rgba(79,124,255,0.07), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
            <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <input
              dir={dir}
              placeholder={isEn ? 'Search...' : 'חיפוש במערכת...'}
              className="w-full bg-transparent outline-none text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8]"
            />
            <kbd className="text-[10px] text-[#94A3B8] bg-white/90 border border-[#E4ECFF] px-2 py-0.5 rounded-md font-mono flex-shrink-0">⌘K</kbd>
          </div>

          <Link to="/" className="hidden md:flex">
            <img src={LOGO} alt="HeadHunter HR-Tech" className="h-[48px] lg:h-[52px] w-auto object-contain" />
          </Link>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
