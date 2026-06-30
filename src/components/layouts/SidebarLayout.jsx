/**
 * SidebarLayout — shared sidebar shell used by all layout types.
 * Accepts: navItems, roleTitle
 */
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ChevronDown, X, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Logo from '@/components/branding/Logo';

const THEME = {
  activeBg: 'bg-[#EEF4FF] text-[#6C4DFF]',
  activeText: 'text-[#6C4DFF]',
  hoverBg: 'hover:bg-[#F5F3FF]',
  childActive: 'bg-[#EEF4FF] text-[#6C4DFF]',
  sidebarBg: 'bg-white border-[#EDE9FE]',
  childBorder: 'border-[#DDD6FE]',
  inactiveText: 'text-[#4B5563]',
};

export default function SidebarLayout({ navItems = [], roleTitle = '' }) {
  const { user, logout, orgType, organization } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const getLabel = (item) => item.labelKey ? t(item.labelKey) : (item.label || '');

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
        {hasChildren ? (
          <>
            <button
              onClick={() => setExpandedMenu(isExpanded ? null : item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? `${THEME.activeBg} font-semibold`
                  : `${THEME.inactiveText} ${THEME.hoverBg}`}`}
            >
              <span className="flex items-center gap-3">
                {item.icon && <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? THEME.activeText : 'text-[#9CA3AF]'}`} />}
                {getLabel(item)}
                {item.badge && (
                  <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform text-[#9CA3AF] ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
              <div className={`${isRtl ? 'mr-6 border-r-2 pr-2' : 'ml-6 border-l-2 pl-2'} mt-1 space-y-0.5 ${THEME.childBorder}`}>
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    to={child.route}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-all
                      ${isActive(child.route)
                        ? `${THEME.childActive} font-semibold`
                        : `text-[#6B7280] hover:text-[#6C4DFF] ${THEME.hoverBg}`}`}
                  >
                    {getLabel(child)}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            to={item.route}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${active
                ? `${THEME.activeBg} font-semibold`
                : `${THEME.inactiveText} ${THEME.hoverBg}`}`}
          >
            {item.icon && <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? THEME.activeText : 'text-[#9CA3AF]'}`} />}
            <span className="flex-1">{getLabel(item)}</span>
            {item.badge && (
              <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        )}
      </div>
    );
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F8F7FF] flex">
      <aside className={`fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-64 flex flex-col transform transition-transform md:translate-x-0 ${THEME.sidebarBg} ${mobileOpen ? 'translate-x-0' : isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Logo */}
        <div className="h-16 border-b border-[#EDE9FE] flex items-center px-5">
          <Logo size="md" />
        </div>

        {/* Nav */}
        <div className="px-3 py-4 space-y-0.5 overflow-y-auto flex-1">
          {renderNavItems(navItems)}
        </div>

        {/* Organization Context Block */}
        <div className="px-4 py-3 border-t border-[#EDE9FE] bg-[#F5F3FF]">
          {orgType === 'platform' ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#6C4DFF]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1F2937] truncate">{t('nav.platform.controlPanel')}</p>
                <p className="text-[10px] text-[#9CA3AF]">Super Admin</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4 text-[#6C4DFF]" />
              </div>
              <div className="min-w-0">
                {organization?.name && (
                  <p className="text-xs font-semibold text-[#1F2937] truncate">{organization.name}</p>
                )}
                <p className="text-[10px] text-[#9CA3AF] truncate">
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
          <button
            onClick={() => setMobileOpen(false)}
            className={`fixed top-4 ${isRtl ? 'left-4' : 'right-4'} z-50 md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg`}
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
