import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicJobService } from '@/api/services/publicJobService';
import { companyService } from '@/api/services/companyService';
import { Users, Building, Briefcase, Star } from 'lucide-react';

export default function StatsSection() {
  const candidates = [];
  const { data: companies = [] } = useQuery({ queryKey: ['stats-comp'], queryFn: () => companyService.list({ limit: 500 }) });
  const { data: jobs = [] } = useQuery({ queryKey: ['stats-jobs'], queryFn: () => publicJobService.list({ is_closed: false, limit: 500 }) });

  const STATS = [
    { icon: Users, color: '#6C4DFF', bg: 'rgba(108,77,255,0.08)', value: `${(candidates.length || 15000).toLocaleString('he-IL')}+`, label: 'מועמדים פעילים' },
    { icon: Building, color: '#4F7CFF', bg: 'rgba(79,124,255,0.08)', value: `${(companies.length || 1200).toLocaleString('he-IL')}+`, label: 'חברות נגיסות' },
    { icon: Briefcase, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', value: `${(jobs.length || 8500).toLocaleString('he-IL')}+`, label: 'משרות פתוחות' },
    { icon: Star, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', value: '98%', label: 'שביעות רצון מועמדים' },
  ];

  return (
    <section dir="rtl" style={{ padding: '80px 0', background: '#F8FAFF' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{
                padding: '36px 28px', borderRadius: 8, textAlign: 'center',
                background: 'white',
                border: '1px solid rgba(108,77,255,0.08)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 56px rgba(108,77,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.04)'; }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Icon style={{ width: 26, height: 26, color: s.color }} />
                </div>
                <div style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1, marginBottom: 10, letterSpacing: '-0.04em' }}>{s.value}</div>
                <div style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
