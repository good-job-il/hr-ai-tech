import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Building, Download, BarChart2,
  Tag, Bot, Shield, Settings, Bell, Send, Home, LogOut,
  Menu, X, ChevronRight, Search, TrendingUp, FileText, Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const LOGO = '/headhunter-logo.png';

const NAV = [
  { label: 'דשבורד ראשי', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'מועמדים', path: '/admin/manage-candidates', icon: Users },
  { label: 'משרות', path: '/admin/manage-jobs', icon: Briefcase },
  { label: 'חברות', path: '/admin/manage-companies', icon: Building },
  null,
  { label: 'יבוא מועמדים', path: '/admin/candidate-import', icon: Download },
  { label: 'ניטור יבוא', path: '/admin/import-monitoring', icon: BarChart2 },
  { label: 'קטגוריות', path: '/admin/taxonomy-verification', icon: Tag },
  { label: 'RoleAlias', path: '/admin/manage-jobs', icon: FileText },
  { label: 'AI Matching', path: '/admin/automations', icon: Bot },
  null,
  { label: 'דוחות ואנליטיקה', path: '/admin/analytics', icon: TrendingUp },
  { label: 'משתמשים והרשאות', path: '/admin/recruiters', icon: Shield },
  { label: 'הגדרות מערכת', path: '/admin/settings', icon: Settings },
  { label: 'יומן פעולות', path: '/admin/applications', icon: Send },
  { label: 'התראות', path: '/admin/applications', icon: Bell },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div dir="rtl" className="min-h-screen flex bg-[#F5FAFF] text-[#0F172A]">
      <aside className="fixed top-0 right-0 bottom-0 z-40 w-[280px] hidden md:flex flex-col bg-white/80 backdrop-blur-2xl border-l border-[#DDEBFF] shadow-[0_30px_90px_rgba(79,124,255,0.12)]">
        <Link to="/" className="h-[96px] flex items-center justify-center px-6 border-b border-[#E4ECFF]">
          <img src={LOGO} alt="HeadHunter HR-Tech" className="h-[58px] w-auto object-contain" />
        </Link>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {NAV.map((item, i) => {
            if (!item) return <div key={i} className="h-px bg-[#E8F0FF] my-4" />;
            const active = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={`${item.label}-${i}`}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={[
                  'group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                  active
                    ? 'bg-gradient-to-l from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] text-white shadow-[0_16px_38px_rgba(108,77,255,0.28)]'
                    : 'text-[#64748B] hover:bg-[#F1F6FF] hover:text-[#6C4DFF]'
                ].join(' ')}
              >
                <Icon className={active ? 'w-5 h-5 text-white' : 'w-5 h-5 text-[#7C3AED]'} />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 rotate-180 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E4ECFF]">
          <Link
            to="/admin/automations"
            className="block rounded-[24px] p-5 bg-gradient-to-br from-[#F5F0FF] to-[#EAF8FF] border border-[#DDEBFF] shadow-[0_20px_50px_rgba(108,77,255,0.12)] mb-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#0F172A] font-black text-sm">מרכז AI למנהלים</div>
                <div className="text-[#64748B] text-xs">תובנות חכמות על המערכת</div>
              </div>
            </div>
          </Link>

          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[#64748B] hover:bg-[#F1F6FF]">
            <Home className="w-4 h-4" /> חזרה לאתר
          </Link>

          <button
            onClick={() => base44.auth.logout('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-[#64748B] hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="w-4 h-4" /> יציאה
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 md:mr-[280px] min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-16 md:h-[72px] lg:h-[88px] bg-white/70 backdrop-blur-2xl border-b border-white/60 shadow-sm px-4 md:px-6 lg:px-8 flex items-center justify-between" style={{ boxShadow: '0 1px 0 rgba(220,235,255,0.8), 0 4px 24px rgba(79,124,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/80 transition" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5 text-[#64748B]" /> : <Menu className="w-5 h-5 text-[#64748B]" />}
            </button>

            {/* Avatar with gradient border */}
            <div className="hidden md:flex items-center gap-3">
              <div className="p-[2px] rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] shadow-[0_0_0_3px_rgba(139,92,246,0.15)]">
                <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] text-white flex items-center justify-center font-black text-lg">
                  {user?.full_name?.[0] || 'מ'}
                </div>
              </div>
              <div>
                <div className="font-black text-[#0F172A] text-sm leading-tight">{user?.full_name || 'שלום, מנהל'}</div>
                <div className="text-xs text-[#94A3B8] font-medium">מנהל מערכת</div>
              </div>
            </div>

            {/* Glowing notification button */}
            <button className="relative w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white/90 border border-white/80 shadow-sm flex items-center justify-center transition hover:shadow-[0_0_0_3px_rgba(108,77,255,0.15)] hover:border-[#C4B5FD]" style={{ boxShadow: '0 2px 8px rgba(108,77,255,0.10)' }}>
              <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-[#6C4DFF]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7C3AED] rounded-full border-2 border-white shadow-[0_0_6px_rgba(124,58,237,0.8)]" />
            </button>
          </div>

          {/* Rounded-full search */}
          <div className="hidden lg:flex items-center gap-3 w-[380px] h-11 rounded-full bg-white/80 border border-white/70 px-5 shadow-sm backdrop-blur-xl" style={{ boxShadow: '0 2px 12px rgba(79,124,255,0.07), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
            <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <input
              dir="rtl"
              placeholder="חיפוש בכל המערכת..."
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