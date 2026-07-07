import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CANDIDATE_NAV } from '@/config/navigation';
import { useAuth } from '@/lib/AuthContext';
import Logo from '@/components/branding/Logo';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function CandidateLayout() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const getLabel = (item) => item.labelKey ? t(item.labelKey) : (item.label || '');

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderNavItems = (items) => items.map((item) => {
    const active = isActive(item.route);
    const hasChildren = item.children?.length > 0;
    const isExpanded = expandedMenu === item.id;

    return (
      <div key={item.id}>
        {hasChildren ? (
          <>
            <button
              onClick={() => setExpandedMenu(isExpanded ? null : item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${active ? 'bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white shadow-lg' : 'text-[#64748B] hover:bg-[#F3EFFF]'}`}
            >
              <span className="flex items-center gap-2">
                {item.icon && <item.icon className="w-4 h-4" />}
                {getLabel(item)}
                {item.badge && <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
              <div className="mr-4 mt-1 space-y-1 border-r-2 border-[#E4ECFF] pr-2">
                {item.children.map((child) => (
                  <Link key={child.id} to={child.route} onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive(child.route) ? 'bg-[#EEF4FF] text-[#7C3AED]' : 'text-[#94A3B8] hover:text-[#6C4DFF]'}`}>
                    {getLabel(child)}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link to={item.route} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${active ? 'bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white shadow-lg' : 'text-[#64748B] hover:bg-[#F3EFFF]'}`}>
            {item.icon && <item.icon className="w-4 h-4" />}
            {getLabel(item)}
            {item.badge && <span className={`${isRtl ? 'mr-auto' : 'ml-auto'} text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center`}>{item.badge}</span>}
          </Link>
        )}
      </div>
    );
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F7FBFF] flex">
      <aside className={`fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-64 bg-white border-[#E4ECFF] flex flex-col transform transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 border-b border-[#E4ECFF] flex items-center px-6">
          <Logo />
        </div>
        <div className="px-4 py-3 border-b border-[#E4ECFF]">
          <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide">{isRtl ? 'מועמד' : 'Candidate'}</div>
          <div className="text-sm font-black text-[#0F172A] mt-0.5">{user?.full_name || (isRtl ? 'מועמד' : 'Candidate')}</div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {renderNavItems(CANDIDATE_NAV)}
        </nav>
        <div className="p-4 border-t border-[#E4ECFF] space-y-2">
          <div className="flex justify-center">
            <LanguageSwitcher variant="badge" />
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-[#EF4444] hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" /> {t('common.logout')}
          </button>
        </div>
      </aside>

      <div className={`flex-1 ${isRtl ? 'md:mr-64' : 'md:ml-64'} flex flex-col min-h-screen`}>
        <header className="h-16 bg-white border-b border-[#E4ECFF] flex items-center justify-between px-6">
          <button onClick={() => setMobileOpen(true)} className="md:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold text-[#64748B]">
            {isRtl ? 'שלום' : 'Hello'}, <span className="text-[#7C3AED]">{user?.full_name}</span>
          </div>
          <LanguageSwitcher variant="minimal" className="text-[#64748B] hidden sm:flex" />
        </header>
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
          <button onClick={() => setMobileOpen(false)} className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <X className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
