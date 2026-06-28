import React, { useState, useMemo } from 'react';
import {
  X, User, Phone, Mail, MapPin, Briefcase, Sparkles, Clock,
  MessageSquare, Calendar, Send, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ActivityTimeline from './ActivityTimeline';
import MatchExplanationCard from '@/components/ai/MatchExplanationCard';
import { scoreMatch } from '@/lib/aiMatching';
import { useIsMobile } from '@/hooks/use-mobile';

const STAGE_VALUES = ['new', 'screening', 'phone_interview', 'professional_interview', 'client_stage', 'hired', 'rejected'];

const TAB_IDS = ['details', 'ai', 'timeline', 'notes'];

function matchColor(score) {
  if (score >= 90) return 'text-green-600 bg-green-50';
  if (score >= 75) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function CandidateDrawer({ application, open, onClose, onStageChange, job }) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('details');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const isMobile = useIsMobile();

  const isRTL = !i18n.language?.startsWith('en');
  const locale = isRTL ? 'he-IL' : 'en-US';

  const tabs = TAB_IDS.map(id => ({
    id,
    label: t(`pipeline.drawer.tabs.${id}`),
    icon: { details: User, ai: Sparkles, timeline: Clock, notes: MessageSquare }[id],
  }));

  const aiMatch = useMemo(() => {
    if (!application) return null;
    const candidate = {
      id: application.candidate_id || application.id,
      full_name: application.candidate_name,
      role_name: application.job_title,
      domain_name: application.domain_name,
      domain_id: application.domain_id,
      experience_years: application.experience_years,
      skills: application.skills || application.tags || [],
      location: application.location,
      desired_salary_min: application.desired_salary_min,
      desired_salary_max: application.desired_salary_max,
    };
    const jobObj = job || {
      id: application.job_id,
      title: application.job_title,
      company: application.company,
      location: application.location,
      domain_id: application.domain_id,
    };
    const { score, explanation } = scoreMatch(candidate, jobObj);
    return { score, explanation };
  }, [application?.id, job?.id]);

  if (!open || !application) return null;

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [...prev, { text: note, time: new Date().toLocaleTimeString(locale) }]);
    setNote('');
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="fixed bg-white z-50 flex flex-col shadow-2xl"
        style={isMobile
          ? { inset: 0 }
          : {
              top: 0,
              ...(isRTL ? { right: 0 } : { left: 0 }),
              height: '100%',
              width: '520px',
              maxWidth: '95vw',
              ...(isRTL ? { borderLeft: '1px solid #E4ECFF' } : { borderRight: '1px solid #E4ECFF' }),
            }
        }
      >
        <div className="flex items-start justify-between p-6 border-b border-[#E4ECFF]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center text-white text-2xl font-black">
              {(application.candidate_name || '?')[0]}
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0F172A]">{application.candidate_name}</h2>
              <p className="text-[#7C3AED] font-bold">{application.job_title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:text-red-500 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-[#F7FBFF] border-b border-[#E4ECFF]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#64748B]">{t('pipeline.drawer.stage')}</span>
            <select
              value={application.status}
              onChange={e => onStageChange(application.id, e.target.value)}
              className="flex-1 h-9 px-3 rounded-xl border border-[#E4ECFF] bg-white text-sm font-bold text-[#0F172A] outline-none"
            >
              {STAGE_VALUES.map(value => (
                <option key={value} value={value}>{t(`pipeline.stages.${value}`)}</option>
              ))}
            </select>
            {application.match_score != null && (
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-black ${matchColor(application.match_score)}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {application.match_score}%
              </div>
            )}
          </div>
        </div>

        <div className="flex border-b border-[#E4ECFF] px-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#7C3AED] text-[#7C3AED]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-5">
              <Section title={t('pipeline.drawer.contactDetails')}>
                <InfoRow icon={Mail} label={t('pipeline.drawer.email')} value={application.candidate_email} />
                <InfoRow icon={Phone} label={t('pipeline.drawer.phone')} value={application.candidate_phone} />
                <InfoRow icon={MapPin} label={t('pipeline.drawer.location')} value={application.location} />
                <InfoRow
                  icon={Briefcase}
                  label={t('pipeline.drawer.experience')}
                  value={application.experience_years ? t('pipeline.drawer.experienceYears', { count: application.experience_years }) : null}
                />
                <InfoRow icon={User} label={t('pipeline.drawer.recruiter')} value={application.recruiter} />
              </Section>

              {application.skills && application.skills.length > 0 && (
                <Section title={t('pipeline.drawer.skills')}>
                  <div className="flex flex-wrap gap-2">
                    {application.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 rounded-full bg-[#F3EFFF] text-[#7C3AED] text-sm font-bold border border-[#E2D8FF]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              {aiMatch && !aiMatch.explanation.requiredMet && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-amber-700">{t('pipeline.drawer.missingRequiredWarning')}</span>
                </div>
              )}

              {aiMatch ? (
                <MatchExplanationCard
                  explanation={aiMatch.explanation}
                  candidateName={application.candidate_name}
                  jobTitle={application.job_title}
                  collapsed={false}
                />
              ) : (
                <p className="text-sm text-[#94A3B8] text-center py-8">{t('pipeline.drawer.noMatchData')}</p>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <ActivityTimeline application={application} />
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t('pipeline.drawer.addNotePlaceholder')}
                  rows={3}
                  className="flex-1 p-3 rounded-xl border border-[#E4ECFF] text-sm font-semibold text-[#0F172A] outline-none resize-none focus:border-[#C4B5FD]"
                />
                <button
                  onClick={addNote}
                  className="self-end h-10 px-4 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm"
                >
                  {t('pipeline.drawer.save')}
                </button>
              </div>
              {application.notes && (
                <div className="p-4 rounded-xl bg-[#F7FBFF] border border-[#E4ECFF]">
                  <p className="text-sm font-semibold text-[#0F172A]">{application.notes}</p>
                </div>
              )}
              {notes.map((n, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#F7FBFF] border border-[#E4ECFF]">
                  <p className="text-sm font-semibold text-[#0F172A]">{n.text}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#E4ECFF] flex gap-3">
          <button className="flex-1 h-11 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            {t('pipeline.drawer.sendMessage')}
          </button>
          <button className="flex-1 h-11 rounded-xl border border-[#E4ECFF] bg-white text-[#64748B] font-bold text-sm flex items-center justify-center gap-2 hover:border-[#C4B5FD]">
            <Calendar className="w-4 h-4" />
            {t('pipeline.drawer.scheduleInterview')}
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-black text-[#64748B] uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#F1F5F9]">
      <Icon className="w-4 h-4 text-[#94A3B8]" />
      <span className="text-xs text-[#94A3B8] font-semibold w-20">{label}</span>
      <span className="text-sm font-bold text-[#0F172A]">{value}</span>
    </div>
  );
}
