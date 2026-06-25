import React, { useState, useEffect } from 'react';
import { X, Eye, Copy, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

function CopyInline({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex-shrink-0 h-6 w-6 rounded flex items-center justify-center transition-all ${copied ? 'text-green-600' : 'text-[#7C3AED] hover:bg-[#F3EFFF]'}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const EMPTY_FORM = {
  title: '',
  company: '',
  category: '',
  location: '',
  type: 'full',
  salary_min: '',
  salary_max: '',
  description: '',
  is_anonymous: false,
  show_company_name: true,
  show_company_info: true,
  show_contact_details: false,
  contact_email: '',
  contact_phone: ''
};

export default function JobFormModal({ job, isOpen, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compensationPlan, setCompensationPlan] = useState(null);

  useEffect(() => {
    if (job) {
      setForm({
        ...EMPTY_FORM,
        ...job,
        salary_min: job.salary_min ?? '',
        salary_max: job.salary_max ?? '',
      });
      // Load compensation plan for this job/company
      const loadCompensation = async () => {
        try {
          const plans = await base44.entities.CompensationPlan.list('', 100);
          // First try to find plan for specific job, then for company
          const jobPlan = plans.find(p => p.job_id === job.id);
          const companyPlan = plans.find(p => p.client_name === job.company && !p.job_id);
          setCompensationPlan(jobPlan || companyPlan || null);
        } catch (err) {
          console.error('Failed to load compensation plan:', err);
        }
      };
      loadCompensation();
    } else {
      setForm(EMPTY_FORM);
      setCompensationPlan(null);
    }
    setError('');
  }, [job, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { setError('שם המשרה הוא חובה'); return; }
    if (!form.company) { setError('שם החברה הוא חובה'); return; }
    if (!form.category) { setError('קטגוריה היא חובה'); return; }

    // Build clean payload — convert salary strings to numbers or omit
    const payload = { ...form };
    payload.salary_min = form.salary_min !== '' ? Number(form.salary_min) : undefined;
    payload.salary_max = form.salary_max !== '' ? Number(form.salary_max) : undefined;
    // Remove empty string fields that aren't required
    ['contact_email', 'contact_phone', 'location', 'description'].forEach(k => {
      if (payload[k] === '') delete payload[k];
    });

    setLoading(true);
    try {
      if (job?.id) {
        await base44.entities.Job.update(job.id, payload);
        // Save warranty_period_days to compensation plan
        if (compensationPlan?.id && compensationPlan.warranty_period_days != null) {
          await base44.entities.CompensationPlan.update(compensationPlan.id, { warranty_period_days: compensationPlan.warranty_period_days });
        }
      } else {
        await base44.entities.Job.create(payload);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{job ? 'עריכת משרה' : 'פרסום משרה חדשה'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              ❌ {error}
            </div>
          )}

          {/* job_code + apply_email — read only, only when editing */}
          {job?.job_code && (
            <div className="bg-[#F7FBFF] border border-[#E4ECFF] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#64748B] w-24 flex-shrink-0">קוד משרה</span>
                <span className="font-mono text-sm font-black text-[#7C3AED] bg-[#F3EFFF] px-2.5 py-0.5 rounded-lg">{job.job_code}</span>
              </div>
              {job.apply_email && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#64748B] w-24 flex-shrink-0">Email alias</span>
                  <span className="font-mono text-sm text-[#374151] break-all flex-1">{job.apply_email}</span>
                  <CopyInline text={job.apply_email} />
                </div>
              )}
              <p className="text-xs text-[#94A3B8]">שלח קורות חיים לכתובת זו — המערכת תקלוט אוטומטית</p>
            </div>
          )}



          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">שם המשרה (תפקיד) *</label>
              <input
                required
                placeholder='מהנדס תוכנה, מנהל מכירות...'
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">שם החברה *</label>
              <input
                required
                placeholder='Google, Apple, סטארטאפ X...'
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">קטגוריה *</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              >
                <option value="">בחר קטגוריה</option>
                <option value="תכנות">תכנות</option>
                <option value="עיצוב">עיצוב</option>
                <option value="בחסות">בחסות</option>
                <option value="מכירות">מכירות</option>
                <option value="ניהול">ניהול</option>
                <option value="הנדסה">הנדסה</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">סוג משרה *</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              >
                <option value="full">משרה מלאה</option>
                <option value="part">משרה חלקית</option>
                <option value="remote">עבודה מרחוק</option>
                <option value="daily">עבודה יומית</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">מיקום</label>
            <input
              placeholder="תל אביב"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">שכר מינימום</label>
              <input
                type="number"
                placeholder="15000"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">שכר מקסימום</label>
              <input
                type="number"
                placeholder="25000"
                value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">תיאור המשרה</label>
            <textarea
              placeholder="תיאור מפורט של תפקיד, דרישות וועדויות..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 resize-none"
            />
          </div>



          {/* Visibility Settings */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> הגדרות חשיפה
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_anonymous}
                  onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked, show_company_name: !e.target.checked, show_company_info: !e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">משרה אנונימית</div>
                  <div className="text-xs text-gray-500">הסתר שם חברה ופרטיה</div>
                </div>
              </label>

              {!form.is_anonymous && (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_company_name}
                      onChange={(e) => setForm({ ...form, show_company_name: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="text-sm font-medium text-gray-900">הצג שם חברה</div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.show_company_info}
                      onChange={(e) => setForm({ ...form, show_company_info: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="text-sm font-medium text-gray-900">הצג מידע על החברה</div>
                  </label>
                </>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_contact_details}
                  onChange={(e) => setForm({ ...form, show_contact_details: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div className="text-sm font-medium text-gray-900">הצג פרטי קשר</div>
              </label>

              {form.show_contact_details && (
                <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="email"
                    placeholder="אימייל"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
                  />
                  <input
                    placeholder="טלפון"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 text-gray-900 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compensation & Warranty Display - Role-based visibility */}
          {compensationPlan && (
            <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-2">
              {/* Warranty period — visible to all roles that can see this modal */}
              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                <span className="text-xs font-bold text-blue-700">תקופת אחריות (ימים):</span>
                {['admin', 'recruitment_manager', 'team_manager'].includes(user?.role) ? (
                  <input
                    type="number"
                    value={compensationPlan.warranty_period_days ?? ''}
                    onChange={(e) => {
                      const days = e.target.value ? Number(e.target.value) : null;
                      setCompensationPlan(prev => prev ? { ...prev, warranty_period_days: days } : null);
                    }}
                    placeholder="30"
                    className="w-24 border border-green-200 rounded-lg px-2 py-1 text-sm text-left font-bold text-blue-800 focus:ring-2 focus:ring-green-300"
                    dir="ltr"
                  />
                ) : (
                  <span className="text-sm font-black text-blue-800">
                    {compensationPlan.warranty_period_days ? `${compensationPlan.warranty_period_days} ימים` : '—'}
                  </span>
                )}
              </div>

              {/* Compensation breakdown — employer cannot see internal compensation */}
              {(() => {
                const formatComp = (value, type, total) => {
                  if (!value) return null;
                  if (type === 'fixed') return `${value.toLocaleString()}₪`;
                  if (type === 'percent' && total) return `${((total * value) / 100).toLocaleString()}₪`;
                  return `${value}%`;
                };
                const canSeeAll = ['recruitment_manager', 'admin'].includes(user?.role);
                return (
                  <>
                    {compensationPlan.recruiter_compensation && (canSeeAll || user?.role === 'recruiter' || user?.role === 'team_manager') && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="text-xs font-bold text-green-700">
                          {user?.role === 'recruiter' ? 'התגמול שלי' : 'רכז גיוס'}:
                        </span>
                        <span className="text-sm font-black text-green-800">
                          {formatComp(compensationPlan.recruiter_compensation, compensationPlan.recruiter_compensation_type, compensationPlan.total_fee)}
                        </span>
                      </div>
                    )}
                    {compensationPlan.team_manager_compensation && (canSeeAll || user?.role === 'team_manager') && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="text-xs font-bold text-green-700">
                          {user?.role === 'team_manager' ? 'התגמול שלי' : 'מנהל צוות'}:
                        </span>
                        <span className="text-sm font-black text-green-800">
                          {formatComp(compensationPlan.team_manager_compensation, compensationPlan.team_manager_compensation_type, compensationPlan.total_fee)}
                        </span>
                      </div>
                    )}
                    {compensationPlan.recruitment_manager_compensation && canSeeAll && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="text-xs font-bold text-green-700">
                          {user?.role === 'recruitment_manager' ? 'התגמול שלי' : 'מנהל גיוס'}:
                        </span>
                        <span className="text-sm font-black text-green-800">
                          {formatComp(compensationPlan.recruitment_manager_compensation, compensationPlan.recruitment_manager_compensation_type, compensationPlan.total_fee)}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

              {/* Actions */}
          <div className="flex gap-3 justify-end border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 h-10 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#6D28D9] hover:to-[#1D4ED8] text-white text-sm font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {loading ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>


    </div>
  );
}