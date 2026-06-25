import { Menu, LogOut, Search, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EditNameModal from './EditNameModal';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function DashboardHeader({ 
  user, 
  roleTitle, 
  onMenuToggle, 
  onLogout,
  showMenuButton = false 
}) {
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');

  return (
    <header 
      className="h-[68px] bg-white border-b border-[#E4ECFF] flex items-center justify-between px-6 gap-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Right: hamburger + user info */}
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button 
            onClick={onMenuToggle}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F7FBFF] transition-all"
          >
            <Menu className="w-5 h-5 text-[#64748B]" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-3">
        <div 
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center text-white text-sm font-black flex-shrink-0"
          title={user?.full_name || user?.email}
        >
          {(user?.full_name || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-black text-[#0F172A] leading-tight">
              {(() => {
                const name = user?.full_name?.trim();
                const greeting = isRtl ? 'שלום' : 'Hello';
                if (name && name.length > 1) {
                  return `${greeting}, ${name}`;
                }
                return greeting;
              })()}
            </div>
            <EditNameModal user={user} />
          </div>
          <div className="text-xs font-semibold text-[#94A3B8]">{roleTitle}</div>
        </div>
        </div>
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]`} />
          <input
            type="text"
            placeholder={isRtl ? 'חיפוש בכל המערכת...' : 'Search the system...'}
            className={`w-full h-9 ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl text-sm text-[#374151] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] transition-all`}
          />
          <kbd className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>
      </div>

      {/* Left: notifications + logout */}
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F7FBFF] transition-all">
          <Bell className="w-4 h-4 text-[#64748B]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <LanguageSwitcher variant="minimal" className="text-[#64748B] hidden sm:flex" />

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-[#EF4444] hover:bg-red-50 transition-all"
        >
          <span className="hidden sm:inline">{t('common.logout')}</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}