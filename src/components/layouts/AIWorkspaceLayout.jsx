import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { AI_WORKSPACE_NAV } from '@/config/navigation';
import GlobalHeader from '@/components/layout/GlobalHeader';
import { useAuth } from '@/lib/AuthContext';

export default function AIWorkspaceLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderNavItems = (items) => items.map((item) => {
    const active = isActive(item.route);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenu === item.id;

    return (
      <div key={item.id}>
        {hasChildren ? (
          <>
            <button
              onClick={() => setExpandedMenu(isExpanded ? null : item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                active
                  ? 'bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white shadow-lg'
                  : 'text-[#64748B] hover:bg-[#F3EFFF]'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#E4ECFF] pl-2">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    to={child.route}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive(child.route)
                        ? 'bg-[#EEF4FF] text-[#7C3AED]'
                        : 'text-[#94A3B8] hover:text-[#6C4DFF]'
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            to={item.route}
            onClick={() => setMobileOpen(false)}
            className={`block px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              active
                ? 'bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white shadow-lg'
                : 'text-[#64748B] hover:bg-[#F3EFFF]'
            }`}
          >
            <span className="flex items-center gap-2">
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
              {item.badge && <span className="ml-auto text-xs bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
            </span>
          </Link>
        )}
      </div>
    );
  });

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#F3EFFF] via-[#F7FBFF] to-[#FFFFFF] flex">
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 bg-white/95 backdrop-blur-xl border-l border-[#E4ECFF] flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-24 border-b border-[#E4ECFF] flex items-center justify-between px-6 bg-gradient-to-l from-[#2F80FF]/5 to-[#8B5CF6]/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#7C3AED]" />
            <img src="/headhunter-logo.png" alt="HeadHunter" className="h-8 w-auto" />
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {renderNavItems(AI_WORKSPACE_NAV)}
        </nav>

        <div className="p-4 border-t border-[#E4ECFF] space-y-2">
          <div className="p-3 rounded-lg bg-gradient-to-br from-[#A855F7]/10 to-[#2F80FF]/10 border border-[#DDEBFF]">
            <div className="text-xs font-bold text-[#6C4DFF] mb-1">ניתוחים פעילים</div>
            <div className="text-2xl font-black text-[#7C3AED]">3</div>
            <div className="text-xs text-[#94A3B8]">עד למסקנות מלאות</div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-[#EF4444] hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            יציאה
          </button>
        </div>
      </aside>

      <div className="flex-1 md:mr-72 flex flex-col min-h-screen">
        <GlobalHeader user={user} variant="private" />
        <main className="flex-1 p-7 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-8 left-8 md:hidden z-50 w-14 h-14 rounded-full bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white flex items-center justify-center shadow-xl"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}