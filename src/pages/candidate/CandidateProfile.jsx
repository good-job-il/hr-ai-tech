import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { candidateProfileService } from '@/api/services/candidateProfileService';
import { fileService } from '@/api/services/fileService';
import { useAuth } from '@/lib/AuthContext';
import {
  User, Briefcase, FileText, Plus, Trash2,
  Upload, Save, CheckCircle2, Eye, EyeOff, Zap, GraduationCap,
  Tag,
} from 'lucide-react';

// Internal keys map to stored DB values (Hebrew) — preserves existing data
const CATEGORY_KEYS = {
  software:    'פיתוח תוכנה',
  design:      'עיצוב UX/UI',
  marketing:   'שיווק',
  sales:       'מכירות',
  finance:     'כספים וחשבונאות',
  hr:          'HR',
  engineering: 'הנדסה',
  medical:     'רפואה ובריאות',
  education:   'חינוך',
  logistics:   'לוגיסטיקה',
  management:  'ניהול',
  other:       'אחר',
};
// Reverse: stored value → key
const DB_TO_KEY = Object.fromEntries(
  Object.entries(CATEGORY_KEYS).map(([k, v]) => [v, k])
);

function ProfileCompleteness({ form, t }) {
  const fields = [
    form?.full_name,
    form?.phone,
    form?.location,
    form?.title,
    form?.summary,
    form?.skills?.length > 0,
    form?.experience?.length > 0,
    form?.education,
    form?.resume_url,
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const color = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';
  const hint = pct < 50
    ? t('candidate.profile.completeBasics')
    : pct < 80
    ? t('candidate.profile.almostThere')
    : t('candidate.profile.nearlyComplete');

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-[#0F172A]">{t('candidate.profile.completeness')}</span>
        <span className="text-sm font-black" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {pct < 100 && (
        <p className="text-xs text-[#94A3B8] mt-2">{hint}</p>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, accent = '#7C3AED' }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h2 className="text-base font-black text-[#0F172A]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-bold text-[#64748B] block mb-1.5">{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none
          focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED] transition-all"
      />
    </div>
  );
}

export default function CandidateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const [skillInput, setSkillInput] = useState('');
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: () => candidateProfileService.me(),
    enabled: !!user,
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (isLoading) return;
    if (form !== null) return;
    if (profile) {
      setForm({ ...profile });
    } else if (user) {
      setForm({
        full_name: user.full_name || '',
        phone: '', location: '', title: '', summary: '',
        skills: [], experience_years: 0, education: '',
        experience: [], desired_salary_min: null, desired_salary_max: null,
        job_type: 'any', categories: [], is_public: true,
        is_open_to_work: false, resume_url: '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, profile, user]);

  const upd = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toSalary = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        desired_salary_min: toSalary(data.desired_salary_min),
        desired_salary_max: toSalary(data.desired_salary_max),
      };
      delete sanitized.id;
      delete sanitized.user_email;
      delete sanitized.created_date;
      delete sanitized.updated_date;
      if (profile) return candidateProfileService.update(sanitized);
      return candidateProfileService.create(sanitized);
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: (savedData) => {
      if (savedData) setForm({ ...savedData });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    },
  });

  const uploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await fileService.upload(file);
    upd('resume_url', file_url);
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    upd('skills', [...(form.skills || []), skillInput.trim()]);
    setSkillInput('');
  };
  const removeSkill = (i) => upd('skills', form.skills.filter((_, idx) => idx !== i));

  const addExp = () => upd('experience', [
    ...(form.experience || []),
    { company: '', role: '', years: '', description: '' },
  ]);
  const updateExp = (i, field, val) => upd('experience',
    form.experience.map((e, idx) => idx === i ? { ...e, [field]: val } : e)
  );
  const removeExp = (i) => upd('experience', form.experience.filter((_, idx) => idx !== i));

  const toggleCategory = (dbValue) => {
    const cats = form.categories || [];
    upd('categories', cats.includes(dbValue) ? cats.filter(c => c !== dbValue) : [...cats, dbValue]);
  };

  const jobTypes = [
    { value: 'any',    label: t('candidate.profile.jobTypes.any') },
    { value: 'full',   label: t('candidate.profile.jobTypes.full') },
    { value: 'part',   label: t('candidate.profile.jobTypes.part') },
    { value: 'remote', label: t('candidate.profile.jobTypes.remote') },
  ];

  if (isLoading || !form) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[#E4ECFF] h-40" />
        ))}
      </div>
    );
  }

  const saveBtnLabel =
    saveStatus === 'saving' ? t('candidate.profile.saving')
    : saveStatus === 'saved'  ? t('candidate.profile.saved')
    : saveStatus === 'error'  ? t('candidate.profile.saveError')
    : t('candidate.profile.saveChanges');

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">{t('candidate.profile.title')}</h1>
          <p className="text-[#64748B] font-semibold mt-1">{t('candidate.profile.subtitle')}</p>
        </div>
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md
            transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
          style={{
            background: saveStatus === 'saved'  ? '#059669'
              : saveStatus === 'error' ? '#DC2626'
              : 'linear-gradient(135deg,#7C3AED,#2563EB)',
          }}
        >
          {saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saveBtnLabel}
        </button>
      </div>

      {/* Completeness + Visibility */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <ProfileCompleteness form={form} t={t} />
        </div>
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex flex-col gap-3">
          <label className="flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2 text-sm font-bold text-[#374151]">
              {form.is_public
                ? <Eye className="w-4 h-4 text-[#7C3AED]" />
                : <EyeOff className="w-4 h-4 text-[#94A3B8]" />}
              {t('candidate.profile.visibleToEmployers')}
            </div>
            <button
              type="button"
              onClick={() => upd('is_public', !form.is_public)}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_public ? 'bg-[#7C3AED]' : 'bg-gray-200'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5
                ${isRtl
                  ? (form.is_public ? '-translate-x-5' : 'translate-x-0')
                  : (form.is_public ? 'translate-x-5'  : 'translate-x-0')}`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Zap className={`w-4 h-4 ${form.is_open_to_work ? 'text-[#059669]' : 'text-[#94A3B8]'}`} />
              <span className={form.is_open_to_work ? 'text-[#059669]' : 'text-[#374151]'}>
                {form.is_open_to_work
                  ? t('candidate.profile.activelyLooking')
                  : t('candidate.profile.openToWork')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => upd('is_open_to_work', !form.is_open_to_work)}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_open_to_work ? 'bg-[#059669]' : 'bg-gray-200'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5
                ${isRtl
                  ? (form.is_open_to_work ? '-translate-x-5' : 'translate-x-0')
                  : (form.is_open_to_work ? 'translate-x-5'  : 'translate-x-0')}`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Personal Info */}
      <SectionCard icon={User} title={t('candidate.profile.personalInfo')} accent="#2563EB">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('candidate.profile.fullName')}
            value={form.full_name}
            onChange={v => upd('full_name', v)}
          />
          <Input
            label={t('common.phone')}
            value={form.phone}
            onChange={v => upd('phone', v)}
          />
          <Input
            label={t('candidate.profile.location')}
            value={form.location}
            onChange={v => upd('location', v)}
          />
          <Input
            label={t('candidate.profile.desiredTitle')}
            value={form.title}
            onChange={v => upd('title', v)}
          />
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-[#64748B] block mb-1.5">
              {t('candidate.profile.bio')}
            </label>
            <textarea
              value={form.summary ?? ''}
              onChange={e => upd('summary', e.target.value)}
              rows={3}
              placeholder={t('candidate.profile.summaryPlaceholder')}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none
                focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] transition-all resize-none"
            />
          </div>
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard icon={Tag} title={t('candidate.profile.skills')} accent="#7C3AED">
        <div className="flex gap-2 mb-3">
          <input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder={t('candidate.profile.addSkillPlaceholder')}
            className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none
              focus:ring-2 focus:ring-[#7C3AED]/25 focus:border-[#7C3AED] transition-all"
          />
          <button
            onClick={addSkill}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {(form.skills || []).length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-3">{t('candidate.profile.noSkills')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(form.skills || []).map((s, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-[#F3EFFF] text-[#7C3AED] text-xs px-3 py-1.5 rounded-full font-semibold">
                {s}
                <button onClick={() => removeSkill(i)} className="hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Experience */}
      <SectionCard icon={Briefcase} title={t('candidate.profile.experience')} accent="#059669">
        <div className="space-y-3 mb-3">
          {(form.experience || []).map((exp, i) => (
            <div key={i} className="border border-[#E4ECFF] rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={t('candidate.profile.companyPlaceholder')}
                  value={exp.company}
                  onChange={v => updateExp(i, 'company', v)}
                />
                <Input
                  placeholder={t('candidate.profile.rolePlaceholder')}
                  value={exp.role}
                  onChange={v => updateExp(i, 'role', v)}
                />
                <div className="col-span-2">
                  <Input
                    placeholder={t('candidate.profile.periodPlaceholder')}
                    value={exp.years}
                    onChange={v => updateExp(i, 'years', v)}
                  />
                </div>
              </div>
              <textarea
                value={exp.description}
                onChange={e => updateExp(i, 'description', e.target.value)}
                placeholder={t('candidate.profile.descriptionPlaceholder')}
                rows={2}
                className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none
                  focus:ring-2 focus:ring-[#059669]/25 focus:border-[#059669] transition-all resize-none"
              />
              <button
                onClick={() => removeExp(i)}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('candidate.profile.remove')}
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addExp}
          className="flex items-center gap-2 text-sm font-bold text-[#059669] hover:text-[#047857] transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('candidate.profile.addJob')}
        </button>
      </SectionCard>

      {/* Education & Preferences */}
      <SectionCard icon={GraduationCap} title={`${t('candidate.profile.education')} & ${t('candidate.profile.preferences')}`} accent="#EA580C">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label={t('candidate.profile.education')}
              value={form.education}
              onChange={v => upd('education', v)}
            />
          </div>
          <Input
            label={t('candidate.profile.experienceYears')}
            type="number"
            value={form.experience_years}
            onChange={v => upd('experience_years', Number(v))}
          />
          <div>
            <label className="text-xs font-bold text-[#64748B] block mb-1.5">
              {t('candidate.profile.jobType')}
            </label>
            <select
              value={form.job_type}
              onChange={e => upd('job_type', e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none
                focus:ring-2 focus:ring-[#EA580C]/25 focus:border-[#EA580C] transition-all bg-white"
            >
              {jobTypes.map(jt => <option key={jt.value} value={jt.value}>{jt.label}</option>)}
            </select>
          </div>
          <Input
            label={t('candidate.profile.minSalary')}
            type="number"
            value={form.desired_salary_min ?? ''}
            onChange={v => upd('desired_salary_min', v === '' ? null : Number(v))}
          />
          <Input
            label={t('candidate.profile.maxSalary')}
            type="number"
            value={form.desired_salary_max ?? ''}
            onChange={v => upd('desired_salary_max', v === '' ? null : Number(v))}
          />
        </div>
      </SectionCard>

      {/* Categories */}
      <SectionCard icon={Tag} title={t('candidate.profile.categories')} accent="#0EA5E9">
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_KEYS).map(([key, dbValue]) => {
            const active = (form.categories || []).includes(dbValue);
            const label = t(`candidate.profile.categoryList.${key}`, dbValue);
            return (
              <button
                key={key}
                onClick={() => toggleCategory(dbValue)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                  active
                    ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                    : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0EA5E9] hover:text-[#0EA5E9]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Resume Upload */}
      <SectionCard icon={FileText} title={t('candidate.profile.resumeSection')} accent="#7C3AED">
        <label className="flex items-center gap-3 bg-[#F8F6FF] border-2 border-dashed border-[#C4B5FD] rounded-xl p-5
          cursor-pointer hover:bg-[#F3EFFF] transition-colors group">
          <Upload className="w-5 h-5 text-[#7C3AED]" />
          <div>
            <div className="text-sm font-bold text-[#374151] group-hover:text-[#7C3AED] transition-colors">
              {form.resume_url
                ? t('candidate.profile.replaceFile')
                : t('candidate.profile.uploadResume')}
            </div>
            <div className="text-xs text-[#94A3B8] mt-0.5">{t('candidate.profile.fileTypes')}</div>
          </div>
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadResume} />
        </label>
        {form.resume_url && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <a
              href={form.resume_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-green-700 hover:underline truncate"
            >
              {t('candidate.profile.fileUploaded')}
            </a>
          </div>
        )}
      </SectionCard>

      {/* Bottom save */}
      <div className={`flex pb-6 ${isRtl ? 'justify-start' : 'justify-end'}`}>
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg
            transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)' }}
        >
          <Save className="w-4 h-4" />
          {saveBtnLabel}
        </button>
      </div>
    </div>
  );
}
