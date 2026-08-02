import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { authService } from '@/api/services/authService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployerLayout from '@/components/employer/EmployerLayout';
import StaffFormModal from '@/components/employer/StaffFormModal';
import CompanyProfileSettings from '@/components/employer/CompanyProfileSettings';
import { Settings, Save, Plus, Trash2, Pencil, Users, Palette } from 'lucide-react';
import { logError } from '@/lib/errorHandler';

export default function EmployerSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    company_name: user?.company_name || '',
    company_phone: user?.company_phone || '',
    company_email: user?.company_email || user?.email || '',
    company_website: user?.company_website || '',
    company_description: user?.company_description || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('company');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const { data: staffMembers = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Staff.filter({ company_id: user.email }) || [];
    },
    enabled: !!user?.email,
  });

  const addStaffMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Staff.create({
        ...data,
        company_id: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', user?.email] });
      setShowStaffModal(false);
      setEditingStaff(null);
    },
    onError: (err) => {
      logError(err, 'add-staff');
      setError('שגיאה בהוספת עובד');
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Staff.update(data.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', user?.email] });
      setShowStaffModal(false);
      setEditingStaff(null);
    },
    onError: (err) => {
      logError(err, 'update-staff');
      setError('שגיאה בעדכון עובד');
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.Staff.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', user?.email] });
    },
    onError: (err) => {
      logError(err, 'delete-staff');
      setError('שגיאה במחיקת עובד');
    },
  });

  const handleStaffSubmit = (data) => {
    if (editingStaff) {
      updateStaffMutation.mutate({ ...data, id: editingStaff.id });
    } else {
      addStaffMutation.mutate(data);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.updateMe(form);
      setSuccess('✓ ההגדרות נשמרו בהצלחה');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      logError(err, 'update-employer-settings');
      setError('שגיאה בשמירת ההגדרות');
    } finally {
      setLoading(false);
    }
  };



  return (
    <EmployerLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8 text-hhblue" /> הגדרות
          </h1>
          <p className="text-gray-500 text-sm mt-1">בחר מה תרצה לנהל</p>
        </div>

        {/* Three Column Layout for Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mb-8">
          {/* Company Settings Card */}
          <button
            onClick={() => setActiveTab('company')}
            className={`text-right rounded-2xl border-2 p-8 transition-all ${
              activeTab === 'company'
                ? 'border-hhblue bg-hhblue/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-hhblue/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Settings className="w-6 h-6 text-hhblue" />
              <h2 className="text-xl font-bold text-gray-900">הגדרות החברה</h2>
            </div>
            <p className="text-sm text-gray-500">ערוך פרטי החברה, טלפון, אתר וכו׳</p>
          </button>

          {/* Company Profile Card */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`text-right rounded-2xl border-2 p-8 transition-all ${
              activeTab === 'profile'
                ? 'border-hhblue bg-hhblue/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-hhblue/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Palette className="w-6 h-6 text-hhblue" />
              <h2 className="text-xl font-bold text-gray-900">פרופיל החברה</h2>
            </div>
            <p className="text-sm text-gray-500">תמונות, וידאו, תרבות והטבות</p>
          </button>

          {/* Team Management Card */}
          <button
            onClick={() => setActiveTab('team')}
            className={`text-right rounded-2xl border-2 p-8 transition-all ${
              activeTab === 'team'
                ? 'border-hhblue bg-hhblue/5 shadow-lg'
                : 'border-gray-200 bg-white hover:border-hhblue/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-hhblue" />
              <h2 className="text-xl font-bold text-gray-900">ניהול צוות</h2>
            </div>
            <p className="text-sm text-gray-500">הוסף, ערוך או מחק עובדים בצוות שלך</p>
          </button>
        </div>

        {/* Company Settings Content */}
        {activeTab === 'company' && (
          <form onSubmit={handleSave} className="max-w-2xl space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                {success}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* Company Info Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי החברה</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">שם החברה</label>
                  <input
                    placeholder="שם החברה שלך"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">דוא"ל ליצירת קשר</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={form.company_email}
                    onChange={(e) => setForm({ ...form, company_email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">טלפון</label>
                  <input
                    placeholder="+972-3-1234567"
                    value={form.company_phone}
                    onChange={(e) => setForm({ ...form, company_phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">אתר אינטרנט</label>
                  <input
                    placeholder="https://example.com"
                    value={form.company_website}
                    onChange={(e) => setForm({ ...form, company_website: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">תיאור החברה</label>
                  <textarea
                    placeholder="תיאור קצר על החברה..."
                    value={form.company_description}
                    onChange={(e) => setForm({ ...form, company_description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-hhblue text-white px-6 py-2 rounded-lg font-semibold hover:bg-hhblue/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </form>
        )}

        {/* Company Profile Content */}
        {activeTab === 'profile' && (
          <CompanyProfileSettings />
        )}

        {/* Team Management Content */}
        {activeTab === 'team' && (
          <div className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-hhblue" /> ניהול צוות
              </h2>
              <button
                onClick={() => { setEditingStaff(null); setShowStaffModal(true); }}
                className="bg-hhblue text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-hhblue/90 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> הוסף עובד
              </button>
            </div>

            {staffLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-gray-200 border-t-hhblue rounded-full animate-spin" />
              </div>
            ) : staffMembers.length === 0 ? (
              <p className="text-gray-500 text-sm py-6">אין עובדים בצוות שלך עדיין</p>
            ) : (
              <div className="space-y-3">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{staff.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{staff.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {staff.role === 'hiring_manager' ? 'מנהל גיוס' : staff.role === 'team_manager' ? 'מנהל צוות' : 'רכז גיוס'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingStaff(staff); setShowStaffModal(true); }}
                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStaffMutation.mutate(staff.id)}
                        disabled={deleteStaffMutation.isPending}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <StaffFormModal
        open={showStaffModal}
        onOpenChange={setShowStaffModal}
        staff={editingStaff}
        teamManagers={staffMembers.filter(s => s.role === 'team_manager')}
        hiringManager={staffMembers.find(s => s.role === 'hiring_manager')}
        onSubmit={handleStaffSubmit}
        loading={addStaffMutation.isPending || updateStaffMutation.isPending}
        showHiringManagerOption={true}
      />
    </EmployerLayout>
  );
}
