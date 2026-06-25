import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Header() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const NAV_LINKS = [
    { label: t('common.jobs'), href: '/jobs' },
    { label: t('common.companies'), href: '/companies' },
    { label: isRtl ? 'AI לקריירה' : 'AI Career', href: '/#ai-center' },
    { label: isRtl ? 'איך זה עובד?' : 'How it works?', href: '/#how' },
    { label: t('common.about'), href: '/#about' },
    { label: isRtl ? 'בלוג' : 'Blog', href: '/#blog' },
    { label: t('common.contact'), href: '/#contact' },
  ];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header dir={isRtl ? 'rtl' : 'ltr'} style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: scrolled ? '1px solid rgba(108,77,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
      boxShadow: scrolled ? '0 4px 32px rgba(108,77,255,0.08)' : 'none',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto', padding: '0 32px',
        height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!user ? (
            <>
              <Link to="/login" style={{
                height: 40, padding: '0 20px', borderRadius: 8,
                border: '1.5px solid rgba(108,77,255,0.2)',
                background: 'transparent',
                fontSize: 14, fontWeight: 600, color: '#374151',
                display: 'flex', alignItems: 'center', textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,77,255,0.06)'; e.currentTarget.style.color = '#6C4DFF'; e.currentTarget.style.borderColor = '#6C4DFF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'rgba(108,77,255,0.2)'; }}>
                {t('common.login')}
              </Link>
              <Link to="/register" style={{
                height: 40, padding: '0 20px', borderRadius: 8,
                background: 'linear-gradient(135deg, #6C4DFF 0%, #4F7CFF 100%)',
                fontSize: 14, fontWeight: 700, color: 'white',
                display: 'flex', alignItems: 'center', gap: 8,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(108,77,255,0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(108,77,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(108,77,255,0.4)'; }}>
                <UserPlus style={{ width: 14, height: 14 }} />
                {isRtl ? 'הרשמה כמועמד חדש' : 'Register as Candidate'}
              </Link>
            </>
          ) : (
            <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'candidate' ? '/candidate-dashboard' : '/hiring-manager/dashboard'} style={{
              height: 40, padding: '0 20px', borderRadius: 8,
              background: 'linear-gradient(135deg, #6C4DFF 0%, #4F7CFF 100%)',
              fontSize: 14, fontWeight: 700, color: 'white', textDecoration: 'none',
              display: 'flex', alignItems: 'center',
              boxShadow: '0 4px 16px rgba(108,77,255,0.4)',
            }}>
              {t('common.dashboard')}
            </Link>
          )}
          <button className="lg:hidden" onClick={() => setOpen(!open)} style={{ width: 40, height: 40, borderRadius: 8, border: '1.5px solid rgba(108,77,255,0.15)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' }}>
            {open ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
          </button>
        </div>

        {/* Center: Nav */}
        <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(link => {
            const active = location.pathname === link.href;
            return (
              <Link key={link.label} to={link.href} style={{
                padding: '7px 13px', borderRadius: 8, fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? '#6C4DFF' : '#64748B',
                textDecoration: 'none', transition: 'all 0.15s',
                background: active ? 'rgba(108,77,255,0.08)' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#6C4DFF'; e.currentTarget.style.background = 'rgba(108,77,255,0.06)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; } }}>
                {link.label}
              </Link>
            );
          })}
          <LanguageSwitcher variant="minimal" className="text-[#64748B] ml-2" />
        </nav>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <img
           src="https://media.base44.com/images/public/6a00f4b05ae5180d66425437/8183f1f0a_Gemini_Generated_Image_6uoodu6uoodu6uoo.png"
           alt="HeadHunter HR-Tech"
           style={{ height: 44, width: 'auto', objectFit: 'contain', imageRendering: 'crisp-edges' }}
          />
        </Link>
      </div>

      {/* Mobile menu */}
      {open && (
        <div dir={isRtl ? 'rtl' : 'ltr'} style={{ background: 'white', borderTop: '1px solid #F0F2FA', padding: '16px 24px 24px' }}>
          {NAV_LINKS.map(link => (
            <Link key={link.label} to={link.href} onClick={() => setOpen(false)} style={{ display: 'block', padding: '12px 0', fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none', borderBottom: '1px solid #F9FAFB' }}>
              {link.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 8, border: '1.5px solid #E2E4EF', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none' }} onClick={() => setOpen(false)}>{t('common.login')}</Link>
            <Link to="/register" style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 8, background: 'linear-gradient(135deg,#6C4DFF,#4F7CFF)', fontSize: 14, fontWeight: 700, color: 'white', textDecoration: 'none' }} onClick={() => setOpen(false)}>{t('common.register')}</Link>
          </div>
          <div style={{ marginTop: 16 }}>
            <LanguageSwitcher variant="badge" />
          </div>
        </div>
      )}
    </header>
  );
}
