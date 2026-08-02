import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/api/services/companyService';
import { Trash2, Search, Edit2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminManageCompanies() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['admin-all-companies'],
    queryFn: () => companyService.list({ sort: 'created_date', order: 'DESC', limit: 200 }),
  });

  const updateMutation = useMutation({
    mutationFn: (company) => companyService.update(company.id, { name: company.name, industry: company.industry, job_count: company.job_count }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-companies'] });
      setEditingCompany(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companyService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-companies'] }),
  });

  const filtered = companies.filter(c => {
    return !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (company) => {
    setEditingCompany(company.id);
    setEditForm({ ...company });
  };

  const handleSave = () => {
    updateMutation.mutate(editForm);
  };

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ניהול חברות</h1>
          <p className="text-sm text-gray-500 mt-1">כל החברות במערכת</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-gray-900">{companies.length}</div>
            <div className="text-xs text-gray-500">חברות בסה"כ</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-blue-600">{companies.reduce((sum, c) => sum + (c.job_count || 0), 0)}</div>
            <div className="text-xs text-gray-500">משרות</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם / תעשייה..."
              className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((company) => (
              <div key={company.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                {editingCompany === company.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="שם החברה"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                    />
                    <input
                      type="text"
                      value={editForm.industry || ''}
                      onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                      placeholder="תעשייה"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                    />
                    <input
                      type="number"
                      value={editForm.job_count || 0}
                      onChange={e => setEditForm({ ...editForm, job_count: parseInt(e.target.value) || 0 })}
                      placeholder="מספר משרות"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex-1 bg-hhblue text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setEditingCompany(null)}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: company.color || '#3da8c8' }}>
                        {company.initials || company.name?.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm truncate">{company.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          {company.industry && <span>{company.industry}</span>}
                          {company.industry && company.job_count > 0 && <span>·</span>}
                          {company.job_count > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">{company.job_count} משרות</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-hhblue transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(company.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">לא נמצאו חברות</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
