import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Lock, Clock, Zap, Shield, Sparkles } from 'lucide-react';

const TRUST = [
  { icon: Lock, label: 'מאובטח ופרטי' },
  { icon: Clock, label: 'הליך מהיר' },
  { icon: Zap, label: 'ללא עלות' },
  { icon: Shield, label: '100% אמינות' },
];

export default function CTASection() {
  return (
    <section dir="rtl" style={{
      padding: '96px 32px',
      background: 'linear-gradient(135deg, #6C4DFF 0%, #4F7CFF 50%, #8B5CF6 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-40%', left: '15%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-50%', right: '5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', filter: 'blur(50px)',
        }} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 18px', borderRadius: 40, marginBottom: 28,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          backdropFilter: 'blur(8px)',
        }}>
          <Sparkles style={{ width: 12, height: 12, color: 'white' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>מוכנים לשדרג את הגיוס שלכם?</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900, color: 'white', margin: '0 0 18px',
          letterSpacing: '-0.04em', lineHeight: 1.1,
          textShadow: '0 2px 20px rgba(0,0,0,0.15)',
        }}>
          מוכן לעשות את הצעד הבא
          <br />בקריירה שלך?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.82)', margin: '0 0 44px', lineHeight: 1.75, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          הצטרף לאלפי מועמדים שמצאו את העבודה שלהם דרך HeadHunter
        </p>

        <Link to="/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          height: 54, padding: '0 36px', borderRadius: 16,
          background: 'white', color: '#6C4DFF',
          fontSize: 15, fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          transition: 'all 0.25s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; }}>
          <UserPlus style={{ width: 18, height: 18 }} />
          הרשמה כמועמד חדש
        </Link>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginTop: 36 }}>
          {TRUST.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.7)' }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}