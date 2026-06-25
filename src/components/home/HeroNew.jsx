import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, MapPin, Sparkles, GraduationCap, Briefcase, Star, CheckCircle, ArrowLeft } from 'lucide-react';

export default function HeroNew() {
  const navigate = useNavigate();

  return (
    <section dir="rtl" style={{
      position: 'relative',
      minHeight: '100vh',
      paddingTop: 68,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 60% -10%, rgba(108,77,255,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 0% 80%, rgba(79,124,255,0.12) 0%, transparent 60%), linear-gradient(180deg, #F8FAFF 0%, #EEF2FF 40%, #F8FAFF 100%)',
    }}>

      {/* Decorative background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(108,77,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,77,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Large glow blobs */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '5%', right: '-5%',
          width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,77,255,0.15) 0%, rgba(108,77,255,0.06) 35%, transparent 65%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-8%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,124,255,0.12) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '35%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1320, margin: '0 auto', padding: '80px 32px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* === RIGHT: Copy === */}
          <div>
            {/* AI Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 18px', borderRadius: 8, marginBottom: 28,
              background: 'rgba(108,77,255,0.08)',
              border: '1px solid rgba(108,77,255,0.2)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C4DFF', boxShadow: '0 0 8px rgba(108,77,255,0.8)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#6C4DFF' }}>פלטפורמת הגיוס המובילה AI בישראל ✨</span>
            </div>

            {/* Main headline */}
            <h1 style={{
              fontSize: 'clamp(3rem, 5.5vw, 4.8rem)',
              fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1.0, margin: '0 0 8px', color: '#0F172A',
            }}>
              הקריירה שלך
            </h1>
            <h1 style={{
              fontSize: 'clamp(3rem, 5.5vw, 4.8rem)',
              fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1.0, margin: '0 0 28px',
              background: 'linear-gradient(135deg, #6C4DFF 0%, #4F7CFF 60%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              מתחילה כאן.
            </h1>

            <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.8, maxWidth: 440, margin: '0 0 40px', fontWeight: 400 }}>
              משרות איכותיות, התאמה אישית, הליך פשוט ומהיר —
              כל מה שצריך כדי למצוא את העבודה הבאה שלך.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
              <button onClick={() => navigate('/register')} style={{
                height: 52, padding: '0 28px', borderRadius: 8,
                background: 'linear-gradient(135deg, #6C4DFF 0%, #4F7CFF 100%)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700,
                boxShadow: '0 8px 28px rgba(108,77,255,0.45), 0 2px 8px rgba(108,77,255,0.2)',
                display: 'flex', alignItems: 'center', gap: 9,
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(108,77,255,0.55), 0 2px 8px rgba(108,77,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 28px rgba(108,77,255,0.45), 0 2px 8px rgba(108,77,255,0.2)'; }}>
                <Search style={{ width: 16, height: 16 }} />
                חיפוש משרות
              </button>
              <button onClick={() => navigate('/register')} style={{
                height: 52, padding: '0 28px', borderRadius: 8,
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                color: '#0F172A', cursor: 'pointer',
                border: '1.5px solid rgba(108,77,255,0.2)',
                fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 9,
                transition: 'all 0.25s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C4DFF'; e.currentTarget.style.color = '#6C4DFF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(108,77,255,0.2)'; e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.transform = ''; }}>
                <UserPlus style={{ width: 16, height: 16 }} />
                הרשמה כמועמד חדש
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', direction: 'ltr' }}>
                {[
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
                ].map((src, i) => (
                  <div key={i} style={{
                    width: 34, height: 34, borderRadius: '50%',
                    border: '2.5px solid white',
                    overflow: 'hidden', marginLeft: i > 0 ? -10 : 0,
                    zIndex: 4 - i, position: 'relative',
                    background: ['#6C4DFF', '#4F7CFF', '#8B5CF6', '#6C4DFF'][i],
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                ))}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: '2.5px solid white', background: 'rgba(108,77,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: -10, zIndex: 0, position: 'relative',
                  fontSize: 10, fontWeight: 700, color: '#6C4DFF',
                }}>+</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, color: '#F59E0B', fill: '#F59E0B' }} />)}
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginRight: 2 }}>4.9</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>מאלפי מועמדים כבר מצאו את הקריירה שלהם</p>
              </div>
            </div>
          </div>

          {/* === LEFT: Visual === */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 560 }}>

            {/* AI Head Image — digital human */}
            {/* AI Head Image — digital human, no circular crop, transparent bg */}
            <div style={{
              position: 'absolute', left: '-5%', top: '50%', transform: 'translateY(-50%)',
              width: 320, height: 380,
              zIndex: 2,
              filter: 'drop-shadow(0 0 60px rgba(108,77,255,0.5)) drop-shadow(0 0 120px rgba(108,77,255,0.25))',
              animation: 'aiImgFloat 4s ease-in-out infinite',
            }}>
              <img
                src="https://media.base44.com/images/public/6a00f4b05ae5180d66425437/06f8a09e2_7B9122B3-A8D2-46AE-98A2-BDE88BD3B6AC.png"
                alt="AI Head"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
              />
            </div>

            {/* Main card — glassmorphism */}
            <div style={{
              position: 'relative', zIndex: 10,
              marginLeft: 90,
              width: 290,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.9)',
              borderRadius: 8,
              boxShadow: '0 32px 80px rgba(108,77,255,0.15), 0 8px 24px rgba(0,0,0,0.06)',
              padding: 22,
              animation: 'heroCardFloat 6s ease-in-out infinite',
            }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', flexShrink: 0 }}>
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=88&h=88&fit=crop&crop=face" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 900, fontSize: 13.5, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>דניאל כהן</p>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: '#6C4DFF', margin: '2px 0 0' }}>Full Stack Developer</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <MapPin style={{ width: 10, height: 10, color: '#94A3B8' }} />
                      <span style={{ fontSize: 10.5, color: '#94A3B8' }}>תל אביב, ישראל</span>
                    </div>
                  </div>
                </div>
                {/* Match circle */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: 44, height: 44 }}>
                    <svg viewBox="0 0 44 44" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="22" cy="22" r="17" fill="none" stroke="#EEF2FF" strokeWidth="3.5" />
                      <circle cx="22" cy="22" r="17" fill="none" strokeWidth="3.5" strokeLinecap="round" stroke="url(#heroGrad)" strokeDasharray="106.8" strokeDashoffset="5.34" />
                      <defs>
                        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6C4DFF" />
                          <stop offset="100%" stopColor="#4F7CFF" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 900, color: '#6C4DFF', lineHeight: 1 }}>95%</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, color: '#94A3B8', display: 'block', marginTop: 2 }}>התאמה</span>
                </div>
              </div>

              {/* AI button */}
              <button style={{
                width: '100%', padding: '9px 0', borderRadius: 8,
                background: 'linear-gradient(135deg, #6C4DFF 0%, #4F7CFF 100%)',
                border: 'none', color: 'white', fontSize: 11.5, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginBottom: 14, boxShadow: '0 4px 14px rgba(108,77,255,0.4)',
              }}>
                <Sparkles style={{ width: 11, height: 11 }} />
                שדרוג קורות חיים עם AI
              </button>

              {/* Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'].map(s => (
                  <span key={s} style={{
                    padding: '3px 8px', borderRadius: 8, fontSize: 10.5, fontWeight: 600,
                    background: 'rgba(108,77,255,0.07)', color: '#6C4DFF',
                    border: '1px solid rgba(108,77,255,0.15)',
                  }}>{s}</span>
                ))}
              </div>

              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(108,77,255,0.12), transparent)', margin: '0 0 14px' }} />

              {/* Experience */}
              {[
                { icon: Briefcase, color: '#6C4DFF', bg: 'rgba(108,77,255,0.08)', title: 'Senior Frontend Developer', sub: 'TalentField • תל אביב | 2023 – היום' },
                { icon: GraduationCap, color: '#4F7CFF', bg: 'rgba(79,124,255,0.08)', title: 'מדעי המחשב B.Sc', sub: 'אוניברסיטת תל אביב | 2021' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '8px 10px', borderRadius: 8, background: 'rgba(248,250,255,0.8)', marginBottom: i === 0 ? 6 : 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 12, height: 12, color: item.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 10.5, fontWeight: 800, color: '#0F172A', margin: 0 }}>{item.title}</p>
                      <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating mini card — match score */}
            <div style={{
              position: 'absolute', bottom: '8%', left: '8%', zIndex: 20,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.95)',
              borderRadius: 8, padding: '11px 16px',
              boxShadow: '0 16px 48px rgba(108,77,255,0.18)',
              display: 'flex', alignItems: 'center', gap: 10,
              animation: 'heroCardFloat 5s ease-in-out infinite 1.5s',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ width: 16, height: 16, color: '#059669' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#059669', margin: 0 }}>+24% ביקוש</p>
                <p style={{ fontSize: 10.5, color: '#94A3B8', margin: 0 }}>בתחום הפיתוח</p>
              </div>
            </div>

            {/* Floating mini card — jobs count */}
            <div style={{
              position: 'absolute', top: '12%', left: '18%', zIndex: 20,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.95)',
              borderRadius: 8, padding: '10px 14px',
              boxShadow: '0 12px 40px rgba(108,77,255,0.15)',
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'heroCardFloat 5s ease-in-out infinite 3s',
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(108,77,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star style={{ width: 13, height: 13, color: '#6C4DFF', fill: '#6C4DFF' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', margin: 0 }}>8,500+</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>משרות פתוחות</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aiImgFloat {
          0%, 100% { transform: translateY(-50%) scale(1); filter: drop-shadow(0 0 60px rgba(108,77,255,0.5)) drop-shadow(0 0 120px rgba(108,77,255,0.25)); }
          50% { transform: translateY(calc(-50% - 14px)) scale(1.02); filter: drop-shadow(0 0 80px rgba(108,77,255,0.65)) drop-shadow(0 0 160px rgba(108,77,255,0.35)); }
        }
        @keyframes heroCardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  );
}