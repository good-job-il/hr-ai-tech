/**
 * SidebarLayout — shared sidebar shell used by all layout types.
 * Accepts: navItems, roleTitle, sidebarTheme ('platform'|'agency'|'company'|'recruiter')
 */
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ChevronDown, X, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Logo from '@/components/branding/Logo';

const THEMES = {
  platform: {
    activeBg: 'bg-gradient-to-l from-[#1E3A5F] to-[#0F172A]',
    hoverBg: 'hover:bg-slate-100',
    childActive: 'text-slate-900 bg-slate-100',
    sidebarBg: 'bg-slate-50 border-slate-200',
    childBorder: 'border-slate-300',
  },
  agency: {
    activeBg: 'bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6]',
    hoverBg: 'hover:bg-[#F3EFFF]',
    childActive: 'bg-[#EEF4FF] text-[#7C3AED]',
    sidebarBg: 'bg-white border-[#E4ECFF]',
    childBorder: 'border-[#E4ECFF]',
  },
  company: {
    activeBg: 'bg-gradient-to-l from-[#059669] to-[#0891B2]',
    hoverBg: 'hover:bg-emerald-50',
    childActive: 'bg-emerald-50 text-emerald-700',
    sidebarBg: 'bg-white border-emerald-100',
    childBorder: 'border-emerald-100',
  },
  recruiter: {
    activeBg: 'bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6]',
    hoverBg: 'hover:bg-[#F3EFFF]',
    childActive: 'bg-[#EEF4FF] text-[#7C3AED]',
    sidebarBg: 'bg-white border-[#E4ECFF]',
    childBorder: 'border-[#E4ECFF]',
  },
};

export default function SidebarLayout({ navItems = [], roleTitle = '', sidebarTheme = 'agency', children }) {
  const { user, logout, orgType, organization } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const getLabel = (item) => item.labelKey ? t(item.labelKey) : (item.label || '');

  const theme = THEMES[sidebarTheme] || THEMES.agency;
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const renderNavItems = (items) => items.map((item) => {
    const active = isActive(item.route);
    const hasChildren = item.children?.length > 0;
    const isExpanded = expandedMenu === item.id;

    return (
      <div key={item.id}>
        {/* Section separator */}
        {(item.separator || item.separatorKey) && (
          <div className="pt-4 pb-1 px-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {item.separatorKey ? t(item.separatorKey) : item.separator}
            </p>
          </div>
        )}
        {hasChildren ? (
          <>
            <button
              onClick={() => setExpandedMenu(isExpanded ? null : item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all
                ${active ? `${theme.activeBg} text-white shadow-lg` : `text-[#64748B] ${theme.hoverBg}`}`}
            >
              <span className="flex items-center gap-2">
                {item.icon && <item.icon className="w-4 h-4" />}
                {getLabel(item)}
                {item.badge && <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
              <div className={`${isRtl ? 'mr-4 border-r-2 pr-2' : 'ml-4 border-l-2 pl-2'} mt-1 space-y-1 ${theme.childBorder}`}>
                {item.children.map((child) => (
                  <Link key={child.id} to={child.route} onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-semibold transition-all
                      ${isActive(child.route) ? theme.childActive : 'text-[#94A3B8] hover:text-[#6C4DFF]'}`}>
                    {getLabel(child)}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link to={item.route} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all
              ${active ? `${theme.activeBg} text-white shadow-lg` : `text-[#64748B] ${theme.hoverBg}`}`}>
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
      <aside className={`fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-64 flex flex-col transform transition-transform md:translate-x-0 ${theme.sidebarBg} ${mobileOpen ? 'translate-x-0' : isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 border-b border-inherit flex items-center px-6">
          <Logo size="md" />
        </div>
        <div className="px-4 py-4 space-y-1 overflow-y-auto flex-1">
          {renderNavItems(navItems)}
        </div>

        {/* Organization Context Block */}
        <div className={`px-4 py-3 border-t ${sidebarTheme === 'platform' ? 'border-slate-200 bg-slate-100' : 'border-gray-100 bg-gray-50'}`}>
          {sidebarTheme === 'platform' ? (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-700 truncate">{t('nav.platform.controlPanel')}</p>
                <p className="text-[10px] text-slate-500">Super Admin</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                {organization?.name && (
                  <p className="text-xs font-black text-gray-800 truncate">{organization.name}</p>
                )}
                <p className="text-[10px] text-gray-500 truncate">
                  {orgType === 'staffing_agency' ? t('platform.orgs.staffing') : orgType === 'organization' ? t('platform.orgs.companies') : orgType}
                  {user?.role && ` · ${
                    user.role === 'org_admin' ? (isRtl ? 'מנהל ארגון' : 'Org Admin') :
                    user.role === 'recruitment_manager' ? (isRtl ? 'מנהל גיוס' : 'Recruitment Manager') :
                    user.role === 'team_manager' ? (isRtl ? 'מנהל צוות' : 'Team Manager') :
                    user.role === 'hr_manager' ? (isRtl ? 'מנהל HR' : 'HR Manager') :
                    user.role === 'recruiter' ? (isRtl ? 'מגייס' : 'Recruiter') :
                    user.role === 'internal_recruiter' ? (isRtl ? 'מגייס פנימי' : 'Internal Recruiter') :
                    user.role}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className={`flex-1 min-w-0 ${isRtl ? 'md:mr-64' : 'md:ml-64'} flex flex-col min-h-screen`}>
        <DashboardHeader
          user={user}
          roleTitle={roleTitle}
          onMenuToggle={() => setMobileOpen(true)}
          onLogout={handleLogout}
          showMenuButton={true}
        />
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          <div className="p-6 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
          <button onClick={() => setMobileOpen(false)} className={`fixed top-4 ${isRtl ? 'left-4' : 'right-4'} z-50 md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg`}>
            <X className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}