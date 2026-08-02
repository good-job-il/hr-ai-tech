import { Menu, LogOut, Search, Bell, ChevronDown, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EditNameModal from './EditNameModal';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function DashboardHeader({
  user,
  roleTitle,
  onMenuToggle,
  onLogout,
  showMenuButton = false,
  platformStyle = false,
}) {
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');

  if (platformStyle) {
    const avatarUrl = user?.avatar_url || user?.picture || user?.profile_image;
    const displayName = user?.full_name?.trim() || user?.email?.split('@')[0] || (isRtl ? 'מנהל מערכת' : 'Platform Admin');

    return (
      <header className="relative z-30 grid h-[82px] shrink-0 grid-cols-[auto_minmax(280px,470px)_1fr] items-center gap-6 border-b border-[#E9EDF6] bg-white px-5 shadow-[0_2px_12px_rgba(54,74,138,0.035)] max-lg:grid-cols-[auto_1fr] max-md:h-[70px] max-md:px-4" dir="ltr">
        <div className="flex min-w-max items-center gap-3">
          {showMenuButton && (
            <button
              onClick={onMenuToggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#65708B] transition hover:bg-[#F6F4FF] md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="hidden items-center gap-3 sm:flex" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#8B5CF6,#2F80FF)] text-sm font-black text-white shadow-[0_5px_14px_rgba(75,91,170,0.18)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                displayName[0]?.toUpperCase()
              )}
            </div>
            <div className="max-w-[150px]">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-black text-[#172036]">
                  {isRtl ? `שלום, ${displayName}` : `Hello, ${displayName}`}
                </p>
                <EditNameModal user={user} />
              </div>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-[#8F9AB2]">{roleTitle}</p>
            </div>
          </div>

          <span className="hidden h-9 w-px bg-[#EDF0F6] sm:block" />

          <button className="relative flex h-11 w-11 items-center justify-center rounded-xl text-[#66708B] transition hover:bg-[#F6F4FF]" aria-label="Notifications">
            <Bell className="h-5 w-5" strokeWidth={1.8} />
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#7C3AED] px-1 text-[9px] font-black text-white">3</span>
          </button>

          <span className="hidden h-9 w-px bg-[#EDF0F6] lg:block" />

          <button className="hidden h-11 items-center gap-3 rounded-[14px] border border-[#E6E9F1] bg-white px-4 text-sm font-bold text-[#5E6881] shadow-[0_3px_12px_rgba(54,74,138,0.035)] transition hover:border-[#D9D2FF] hover:bg-[#FAF9FF] lg:flex" dir={isRtl ? 'rtl' : 'ltr'}>
            <ChevronDown className="h-4 w-4" />
            <span>{isRtl ? 'פעולות מהירות' : 'Quick actions'}</span>
            <Zap className="h-4 w-4 text-[#8B5CF6]" />
          </button>
        </div>

        <div className="relative hidden w-full lg:block" dir={isRtl ? 'rtl' : 'ltr'}>
          <Search className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 h-5 w-5 -translate-y-1/2 text-[#69748E]`} strokeWidth={1.8} />
          <input
            type="text"
            placeholder={isRtl ? 'חיפוש בכל המערכת...' : 'Search across the platform...'}
            className={`h-11 w-full rounded-[18px] border border-[#E6E9F1] bg-white text-sm text-[#374151] shadow-[0_3px_12px_rgba(54,74,138,0.035)] outline-none transition placeholder:text-[#B0B7C7] focus:border-[#BDB1FF] focus:ring-4 focus:ring-[#F1EEFF] ${isRtl ? 'pr-13 pl-16' : 'pl-13 pr-16'}`}
          />
          <kbd className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 rounded-lg bg-[#F6F7FA] px-2 py-1 text-[10px] font-semibold text-[#8F97A9]`}>⌘ K</kbd>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher variant="minimal" className="hidden text-[#7A849B] xl:flex" />
          <button
            onClick={onLogout}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#A2AABC] transition hover:bg-red-50 hover:text-red-500"
            title={t('common.logout')}
            aria-label={t('common.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
    );
  }

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
