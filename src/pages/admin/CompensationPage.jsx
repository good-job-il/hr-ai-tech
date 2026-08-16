import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compensationPlanService } from '@/api/services/compensationPlanService';
import { jobService } from '@/api/services/jobService';
import { useAuth } from '@/lib/AuthContext';
import { usePermissionMatrix } from '@/hooks/usePermissionMatrix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, DollarSign, Percent, Calculator, Settings } from 'lucide-react';

// Which compensation fields can this role see?
// Employer does NOT have access to compensation at all
const VISIBLE_FIELDS = {
  admin:                ['recruiter', 'team_manager', 'recruitment_manager'],
  recruitment_manager:  ['recruiter', 'team_manager', 'recruitment_manager'],
  team_manager:         ['recruiter', 'team_manager'],
  recruiter:            ['recruiter'],
};

const FIELD_LABELS = {
  recruiter:           'רכז גיוס',
  team_manager:        'מנהל צוות',
  recruitment_manager: 'מנהל גיוס',
};

const canEditGlobally = (role) => role === 'admin';

function CompField({ label, value, type, totalFee }) {
  const icon = type === 'percent' ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />;
  const displayValue = value != null ? (type === 'percent' ? `${value}%` : `${value.toLocaleString()} ₪`) : '—';
  const calculatedAmount = value != null && totalFee ? (type === 'percent' ? (totalFee * value / 100) : value) : null;
  
  return (
    <div className="flex flex-col gap-0.5 bg-purple-50 rounded-lg px-3 py-1.5 text-sm border border-purple-100">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-gray-500 text-xs">{label}:</span>
        <span className="font-bold text-purple-700">{displayValue}</span>
      </div>
      {calculatedAmount != null && (
        <div className="text-xs text-green-600 font-bold pr-5">
          {calculatedAmount.toLocaleString()} ₪
        </div>
      )}
    </div>
  );
}

const emptyPlan = {
  client_name: '',
  job_id: '',
  total_fee: '',
  warranty_period_days: 30,
  recruiter_compensation: '',
  recruiter_compensation_type: 'percent',
  team_manager_compensation: '',
  team_manager_compensation_type: 'percent',
  recruitment_manager_compensation: '',
  recruitment_manager_compensation_type: 'percent',
  notes: '',
};

export default function CompensationPage() {
  const { user } = useAuth();
  const { can } = usePermissionMatrix();
  const role = user?.role;
  const visibleFields = VISIBLE_FIELDS[role] || [];
  const isAdmin = canEditGlobally(role);
  const canEditing = can('edit_compensation');
  const canViewComp = can('view_compensation');
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [modalType, setModalType] = useState('plan'); // 'plan' or 'template'

  const orgId = user?.organization_id;

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['compensation-plans', orgId],
    queryFn: () => compensationPlanService.list({ sort: 'created_date', order: 'DESC', limit: 100 }),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-for-compensation', orgId],
    queryFn: () => jobService.list({ organization_id: orgId, is_deleted: false, sort: 'created_date', order: 'DESC', limit: 100 }),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing
        ? compensationPlanService.update(editing.id, data)
        : compensationPlanService.create(data),
    onSuccess: () => { qc.invalidateQueries(['compensation-plans', orgId]); setShowModal(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => compensationPlanService.remove(id),
    onSuccess: () => qc.invalidateQueries(['compensation-plans', orgId]),
  });

  const openNew = () => { setEditing(null); setForm(emptyPlan); setModalType('plan'); setShowModal(true); };
  const openEdit = (plan) => { setEditing(plan); setForm({ ...plan }); setModalType('plan'); setShowModal(true); };
  const openTemplate = (existingPlan = null) => { 
    const formData = existingPlan ? {
      client_name: existingPlan.client_name || '',
      job_id: existingPlan.job_id || '',
      total_fee: existingPlan.total_fee ?? '',
      warranty_period_days: existingPlan.warranty_period_days ?? 30,
      recruiter_compensation: existingPlan.recruiter_compensation ?? '',
      recruiter_compensation_type: existingPlan.recruiter_compensation_type || 'percent',
      team_manager_compensation: existingPlan.team_manager_compensation ?? '',
      team_manager_compensation_type: existingPlan.team_manager_compensation_type || 'percent',
      recruitment_manager_compensation: existingPlan.recruitment_manager_compensation ?? '',
      recruitment_manager_compensation_type: existingPlan.recruitment_manager_compensation_type || 'percent',
      notes: existingPlan.notes || '',
    } : emptyPlan;
    setEditing(existingPlan);
    setForm(formData);
    setModalType('template'); 
    setShowModal(true); 
  };

  const handleSave = () => {
    const data = {
      client_name: form.client_name,
      job_id: form.job_id || null,
      warranty_period_days: form.warranty_period_days ? Number(form.warranty_period_days) : 30,
      notes: form.notes,
      total_fee: form.total_fee !== '' ? Number(form.total_fee) : null,
      recruiter_compensation: form.recruiter_compensation !== '' ? Number(form.recruiter_compensation) : null,
      recruiter_compensation_type: form.recruiter_compensation_type,
      team_manager_compensation: form.team_manager_compensation !== '' ? Number(form.team_manager_compensation) : null,
      team_manager_compensation_type: form.team_manager_compensation_type,
      recruitment_manager_compensation: form.recruitment_manager_compensation !== '' ? Number(form.recruitment_manager_compensation) : null,
      recruitment_manager_compensation_type: form.recruitment_manager_compensation_type,
    };
    saveMutation.mutate(data);
  };

  // Calculate actual amounts based on percentages
  const calculateAmount = (value, type) => {
    if (!value || !form.total_fee) return null;
    const num = Number(value);
    const total = Number(form.total_fee);
    return type === 'percent' ? (total * num / 100) : num;
  };

  const totalFee = form.total_fee ? Number(form.total_fee) : 0;

  // Block if no compensation permission at all
  if (!VISIBLE_FIELDS[role] && !canViewComp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-lg">מערכת תגמולים אינה זמינה</p>
          <p className="text-sm mt-1">אין לך הרשאה לצפות בדף זה.</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">ניהול תגמולים</h1>
          <p className="text-sm text-gray-500 mt-1">{canEditing ? 'הגדרת טמפלט תגמול וניהול לפי משרה' : 'תוכניות תגמול'}</p>
        </div>
        <div className="flex gap-2">
          {canEditing && (
            <Button onClick={() => openTemplate()} className="gap-2 bg-slate-600 hover:bg-slate-700 text-white">
              <Settings className="w-4 h-4" />
              טמפלט הגדרות
            </Button>
          )}
          {isAdmin && (
            <Button onClick={openNew} className="gap-2 bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4" />
              תוכנית חדשה
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : (
        <div className="space-y-4">
          {/* משרות עם תגמולים */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">משרות ותגמולים</h2>
            {jobs.length === 0 ? (
              <p className="text-center py-8 text-gray-400">אין משרות</p>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => {
                  const jobPlan = plans.find(p => p.job_id === job.id);
                  const defaultPlan = plans.find(p => p.client_name === job.company && !p.job_id);
                  const finalPlan = jobPlan || defaultPlan;
                  return (
                    <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900">{job.title}</span>
                            <span className="text-xs text-gray-400">{job.company}</span>
                            {jobPlan && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">מקצה משרה</span>}
                          </div>
                          {finalPlan && (
                            <div className="flex flex-wrap gap-2 items-center">
                              {visibleFields.includes('recruiter') && (
                                <CompField label={FIELD_LABELS.recruiter} value={finalPlan.recruiter_compensation} type={finalPlan.recruiter_compensation_type} totalFee={finalPlan.total_fee} />
                              )}
                              {visibleFields.includes('team_manager') && (
                                <CompField label={FIELD_LABELS.team_manager} value={finalPlan.team_manager_compensation} type={finalPlan.team_manager_compensation_type} totalFee={finalPlan.total_fee} />
                              )}
                              {visibleFields.includes('recruitment_manager') && (
                                <CompField label={FIELD_LABELS.recruitment_manager} value={finalPlan.recruitment_manager_compensation} type={finalPlan.recruitment_manager_compensation_type} totalFee={finalPlan.total_fee} />
                              )}
                              {finalPlan.warranty_period_days != null && (
                                <div className="flex items-center gap-1 bg-blue-50 rounded-lg px-3 py-1.5 text-xs border border-blue-100">
                                  <span className="text-blue-500">אחריות:</span>
                                  <span className="font-bold text-blue-700">{finalPlan.warranty_period_days} ימים</span>
                                </div>
                              )}
                            </div>
                          )}
                          {!finalPlan && <p className="text-xs text-gray-400 mt-1">לא הוגדר תגמול</p>}
                        </div>
                        {canEditing && (
                          <button onClick={() => {
                            // jobPlan has an id (existing), no-id means new plan for this job
                            const existing = jobPlan || null;
                            setEditing(existing);
                            setForm({
                              client_name: existing?.client_name || job.company,
                              job_id: existing?.job_id || job.id,
                              total_fee: existing?.total_fee ?? '',
                              warranty_period_days: existing?.warranty_period_days ?? 30,
                              recruiter_compensation: existing?.recruiter_compensation ?? '',
                              recruiter_compensation_type: existing?.recruiter_compensation_type || 'percent',
                              team_manager_compensation: existing?.team_manager_compensation ?? '',
                              team_manager_compensation_type: existing?.team_manager_compensation_type || 'percent',
                              recruitment_manager_compensation: existing?.recruitment_manager_compensation ?? '',
                              recruitment_manager_compensation_type: existing?.recruitment_manager_compensation_type || 'percent',
                              notes: existing?.notes || '',
                            });
                            setModalType('plan');
                            setShowModal(true);
                          }} className="p-2 rounded-lg hover:bg-purple-50 text-purple-600">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* תוכניות כלליות */}
          {isAdmin && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">תוכניות כלליות (לפי לקוח)</h2>
              {plans.filter(p => !p.job_id).length === 0 ? (
                <p className="text-center py-8 text-gray-400">אין תוכניות כלליות</p>
              ) : (
                <div className="space-y-3">
                  {plans.filter(p => !p.job_id).map(plan => (
                    <div key={plan.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span className="font-bold text-gray-900">{plan.client_name}</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {visibleFields.includes('recruiter') && (
                              <CompField label={FIELD_LABELS.recruiter} value={plan.recruiter_compensation} type={plan.recruiter_compensation_type} totalFee={plan.total_fee} />
                            )}
                            {visibleFields.includes('team_manager') && (
                              <CompField label={FIELD_LABELS.team_manager} value={plan.team_manager_compensation} type={plan.team_manager_compensation_type} totalFee={plan.total_fee} />
                            )}
                            {visibleFields.includes('recruitment_manager') && (
                              <CompField label={FIELD_LABELS.recruitment_manager} value={plan.recruitment_manager_compensation} type={plan.recruitment_manager_compensation_type} totalFee={plan.total_fee} />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(plan)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(plan.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'template' 
                ? 'טמפלט תגמול ברירת מחדל' 
                : editing ? 'עריכת תוכנית תגמול' : 'תוכנית תגמול חדשה'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>לקוח / חברה *</Label>
              <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="שם הלקוח" className="mt-1" />
            </div>
            <div>
              <Label>עמלה כוללת מהחברה (₪) *</Label>
              <Input
                type="number"
                value={form.total_fee}
                onChange={e => setForm(f => ({ ...f, total_fee: e.target.value }))}
                placeholder="סכום העמלה שהחברה משלמת"
                className="mt-1"
                dir="ltr"
              />
            </div>
            <div>
              <Label>תקופת אחריות (ימים)</Label>
              <Input
                type="number"
                value={form.warranty_period_days}
                onChange={e => setForm(f => ({ ...f, warranty_period_days: e.target.value }))}
                placeholder="30"
                className="mt-1"
                dir="ltr"
              />
            </div>
            {totalFee > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700">חישוב מהיר</span>
                </div>
                <div className="space-y-1 text-xs">
                  {['recruiter', 'team_manager', 'recruitment_manager'].map(key => {
                    const val = form[`${key}_compensation`];
                    const type = form[`${key}_compensation_type`];
                    if (!val) return null;
                    const amount = calculateAmount(val, type);
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{FIELD_LABELS[key]}:</span>
                        <span className="font-bold text-green-700">
                          {amount ? `${amount.toLocaleString()} ₪` : '—'}
                          {type === 'percent' && <span className="text-gray-400 mr-1">({val}%)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <Label>ID משרה (אופציונלי)</Label>
              <Input value={form.job_id} onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))} placeholder="אם ריק — חל על כל משרות הלקוח" className="mt-1" dir="ltr" />
            </div>

            {[
              { key: 'recruiter', label: 'תגמול רכז גיוס' },
              { key: 'team_manager', label: 'תגמול מנהל צוות' },
              { key: 'recruitment_manager', label: 'תגמול מנהל גיוס' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    value={form[`${key}_compensation`]}
                    onChange={e => setForm(f => ({ ...f, [`${key}_compensation`]: e.target.value }))}
                    placeholder="סכום"
                    className="flex-1"
                    dir="ltr"
                  />
                  <Select
                    value={form[`${key}_compensation_type`]}
                    onValueChange={v => setForm(f => ({ ...f, [`${key}_compensation_type`]: v }))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">₪ קבוע</SelectItem>
                      <SelectItem value="percent">% אחוז</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <div>
              <Label>הערות</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="הערות נוספות" className="mt-1" />
            </div>

            <div className="flex gap-2 pt-2">
              {editing && (
                <Button variant="destructive" onClick={() => { 
                  if (confirm('האם אתה בטוח שאתה רוצה למחוק?')) {
                    deleteMutation.mutate(editing.id);
                  }
                }} disabled={deleteMutation.isPending} className="flex-1">
                  {deleteMutation.isPending ? 'מוחק...' : 'מחק'}
                </Button>
              )}
              <Button onClick={handleSave} disabled={!form.client_name || saveMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                {saveMutation.isPending ? 'שומר...' : 'שמור'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
