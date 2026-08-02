import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Menu, X, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { authService } from '@/api/services/authService';
import LocationConfirmModal from '@/components/home/LocationConfirmModal';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const LOGO_URL = '/logo.png';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [initialCity, setInitialCity] = useState(null);
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const loadLocation = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastCheck = localStorage.getItem('locationCheckDate');

      if (lastCheck === today) {
        const savedCity = localStorage.getItem('selectedCity');
        setSelectedCity(savedCity || (isRtl ? 'תל אביב' : 'Tel Aviv'));
        return;
      }

      try {
        const response = await base44.functions.invoke('getLocationFromIP', {});
        const detectedCity = response.data?.city || (isRtl ? 'תל אביב' : 'Tel Aviv');
        setInitialCity(detectedCity);
        const savedCity = localStorage.getItem('selectedCity');
        if (!savedCity && isHomePage) {
          setShowLocationModal(true);
        } else {
          setSelectedCity(savedCity || detectedCity);
        }
        localStorage.setItem('locationCheckDate', today);
      } catch {
        const fallback = isRtl ? 'תל אביב' : 'Tel Aviv';
        setInitialCity(fallback);
        const savedCity = localStorage.getItem('selectedCity');
        if (!savedCity && isHomePage) {
          setShowLocationModal(true);
        } else {
          setSelectedCity(savedCity || fallback);
        }
        localStorage.setItem('locationCheckDate', today);
      }
    };
    loadLocation();
  }, [isRtl]);

  const handleLocationConfirm = (city) => {
    setSelectedCity(city);
    localStorage.setItem('selectedCity', city);
    setShowLocationModal(false);
  };

  const handleChangeLocation = () => {
    setShowLocationModal(true);
  };

  const dashboardLink = () => {
    const role = user?.role || user?.user_type || '';
    const map = {
      recruiter: '/agency/recruiter/dashboard',
      team_manager: '/agency/dashboard',
      recruitment_manager: '/agency/dashboard',
      org_admin: '/agency/dashboard',
      employer: '/employer/dashboard',
      hiring_manager: '/employer/dashboard',
      candidate: '/candidate/dashboard',
      admin: '/platform/dashboard',
    };
    return map[role] || '/';
  };

  const navLinks = [
    { label: t('common.jobs'), to: '/jobs' },
    { label: t('common.companies'), to: '/companies' },
    { label: isRtl ? 'AI לקריירה' : 'AI Career', to: '/ai-career' },
    { label: isRtl ? 'איך זה עובד?' : 'How it works?', to: '/how-it-works' },
    { label: isRtl ? 'בלוג' : 'Blog', to: '/blog' },
    { label: isRtl ? 'משאבים' : 'Resources', to: '/resources' },
    { label: t('common.about'), to: '/about' },
  ];

  return (
    <header
      className="sticky top-0 z-50 bg-white/82 backdrop-blur-2xl border-b border-[#E4ECFF]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-[1560px] mx-auto px-8 h-[86px] flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={LOGO_URL} alt="HeadHunter HR-Tech" className="h-12 w-auto object-contain" style={{ imageRendering: 'crisp-edges' }} />
        </Link>

        {/* Center: nav links */}
        <nav className="hidden lg:flex items-center gap-7 text-[#172033] font-semibold">
          {navLinks.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`transition hover:text-[#6C4DFF] ${active ? 'text-[#6C4DFF]' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard" className="text-purple-600 flex items-center gap-1 hover:text-purple-700 transition">
              <Shield className="w-3.5 h-3.5" /> {isRtl ? 'ניהול' : 'Admin'}
            </Link>
          )}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          {selectedCity && (
            <div
              onClick={handleChangeLocation}
              className="hidden md:flex items-center gap-1 text-[#64748B] text-sm hover:text-[#6C4DFF] transition cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{selectedCity}</span>
            </div>
          )}

          <LanguageSwitcher variant="minimal" className="text-[#64748B] hidden md:flex" />

          {user ? (
            <>
              <Link
                to={dashboardLink()}
                className="hidden sm:inline-flex h-12 px-7 items-center justify-center rounded-2xl border border-[#C9D8FF] bg-white/70 text-[#6C4DFF] font-bold shadow-sm hover:shadow-md transition"
              >
                {t('common.dashboard')}
              </Link>
              <button
                onClick={() => authService.logout('/')}
                className="inline-flex h-12 px-7 items-center justify-center rounded-2xl bg-gradient-to-l from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] text-white font-bold shadow-[0_16px_35px_rgba(108,77,255,0.28)] hover:scale-[1.02] transition"
              >
                {t('common.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex h-12 px-7 items-center justify-center rounded-2xl border border-[#C9D8FF] bg-white/70 text-[#6C4DFF] font-bold shadow-sm hover:shadow-md transition"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex h-12 px-7 items-center justify-center rounded-2xl bg-gradient-to-l from-[#2F80FF] via-[#6C4DFF] to-[#A855F7] text-white font-bold shadow-[0_16px_35px_rgba(108,77,255,0.28)] hover:scale-[1.02] transition gap-2"
              >
                <UserPlus className="w-5 h-5" />
                {isRtl ? 'הרשמה כמועמד חדש' : 'Register as Candidate'}
              </Link>
            </>
          )}

          <button
            className="lg:hidden text-[#374151]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-[#E4ECFF] px-6 py-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="block text-[#374151] text-sm py-3 font-medium hover:text-[#6C4DFF] border-b border-gray-50 transition"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard" className="block text-purple-600 text-sm py-3 font-medium" onClick={() => setMobileOpen(false)}>
              🛡 {isRtl ? 'ניהול' : 'Admin'}
            </Link>
          )}
          <div className="flex gap-3 pt-4">
            {user ? (
              <>
                <Link to={dashboardLink()} className="flex-1 text-center py-3 rounded-xl border border-[#C9D8FF] text-[#6C4DFF] font-bold text-sm" onClick={() => setMobileOpen(false)}>
                  {t('common.dashboard')}
                </Link>
                <button onClick={() => { authService.logout('/'); setMobileOpen(false); }} className="flex-1 py-3 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#A855F7] text-white font-bold text-sm">
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex-1 text-center py-3 rounded-xl border border-[#C9D8FF] text-[#6C4DFF] font-bold text-sm" onClick={() => setMobileOpen(false)}>
                  {t('common.login')}
                </Link>
                <Link to="/register" className="flex-1 text-center py-3 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#A855F7] text-white font-bold text-sm" onClick={() => setMobileOpen(false)}>
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>
          <div className="pt-3">
            <LanguageSwitcher variant="badge" />
          </div>
        </div>
      )}

      {showLocationModal && initialCity && (
        <LocationConfirmModal
          initialCity={initialCity}
          onConfirm={handleLocationConfirm}
          onDismiss={() => {
            setShowLocationModal(false);
            setSelectedCity(initialCity);
            localStorage.setItem('selectedCity', initialCity);
          }}
        />
      )}
    </header>
  );
}
