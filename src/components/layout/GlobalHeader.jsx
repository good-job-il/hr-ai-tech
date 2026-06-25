/**
 * Global Header - Unified across entire platform
 * Used on all pages (public, auth, dashboard, etc)
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SPACING, SHADOWS, RADIUS, COLORS } from '@/theme/tokens';
import Logo from '@/components/branding/Logo';

const HEADER_HEIGHT = 88;
const HEADER_PADDING = SPACING[6]; // 24px

const navLinks = [
  { label: 'משרות', href: '/jobs' },
  { label: 'חברות', href: '/companies' },
  { label: 'AI לקריירה', href: '/#ai' },
  { label: 'איך זה עובד?', href: '/#how' },
  { label: 'אודות', href: '/#about' },
];

export default function GlobalHeader({ user, variant = 'public' }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDarkBg = location.pathname.startsWith('/admin') || 
                   location.pathname.startsWith('/employer') ||
                   location.pathname.startsWith('/dashboard');

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 transition-all duration-200"
      style={{
        height: `${HEADER_HEIGHT}px`,
        background: isDarkBg 
          ? `${COLORS.neutral[0]}/70`
          : `${COLORS.glass.bg}`,
        backdropFilter: 'blur(26px)',
        WebkitBackdropFilter: 'blur(26px)',
        borderBottom: `1px solid ${COLORS.glass.border}`,
        boxShadow: SHADOWS['glass'],
      }}
    >
      <div
        className="h-full max-w-[1600px] mx-auto px-7 flex items-center justify-between"
        style={{ paddingLeft: HEADER_PADDING, paddingRight: HEADER_PADDING }}
      >
        {/* Logo */}
        <Logo size="lg" href="/" />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className="relative px-4 py-2 text-[15px] font-black rounded-2xl transition-all"
                style={{
                  color: isActive ? '#7C3AED' : '#334155',
                  background: isActive ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-14px',
                      right: '50%',
                      transform: 'translateX(50%)',
                      width: '34px',
                      height: '3px',
                      borderRadius: '8px',
                      background: 'linear-gradient(90deg, #8B5CF6, #2F80FF)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex h-12 px-7 items-center justify-center rounded-lg border font-black text-[15px] transition-all"
                style={{
                  borderColor: '#DDEBFF',
                  color: '#6C4DFF',
                  background: '#FFFFFF',
                  boxShadow: SHADOWS['glass-card'],
                }}
              >
                התחברות
              </Link>

              <Link
                to="/register"
                className="inline-flex h-12 px-7 items-center justify-center rounded-lg text-white font-black text-[15px] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #6C4DFF 48%, #2F80FF 100%)',
                  boxShadow: '0 18px 42px rgba(108, 77, 255, 0.35)',
                }}
              >
                הרשמה
              </Link>
            </>
          ) : (
            <>
              <Link
                to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'candidate' ? '/candidate-dashboard' : '/employer/dashboard'}
                className="inline-flex h-12 px-7 items-center justify-center rounded-lg text-white font-black text-[15px] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #2F80FF)',
                  boxShadow: '0 18px 42px rgba(108, 77, 255, 0.30)',
                }}
              >
                לוח בקרה
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: COLORS.glass.bg,
              border: `1px solid ${COLORS.glass.border}`,
            }}
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-[#334155]" />
            ) : (
              <Menu className="w-5 h-5 text-[#334155]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t transition-all duration-200"
          style={{
            borderColor: COLORS.glass.border,
            background: `${COLORS.glass.hover}`,
            backdropFilter: 'blur(26px)',
          }}
        >
          <nav className="max-w-[1600px] mx-auto px-7 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-[15px] font-bold rounded-lg transition-all"
                style={{
                  color: location.pathname === link.href ? '#7C3AED' : '#334155',
                  background: location.pathname === link.href ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}