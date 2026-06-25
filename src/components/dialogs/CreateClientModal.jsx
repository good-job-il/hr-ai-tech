import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function CreateClientModal({ isOpen, onClose, onSuccess }) {
  const [clientName, setClientName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!clientName.trim()) return;
    setError('');
    setCreating(true);
    try {
      await base44.entities.Organization.create({
        name: clientName,
        org_type: 'organization',
        status: 'active',
      });
      setClientName('');
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'שגיאה בעת יצירת לקוח');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
        <h3 className="text-xl font-black text-gray-900 mb-4">לקוח חדש</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">שם הלקוח</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="לדוגמה: TechCorp Israel"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-purple-400"
              disabled={creating}
            />
          </div>
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50"
              disabled={creating}
            >
              ביטול
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50"
              disabled={creating || !clientName.trim()}
            >
              {creating ? 'יוצר...' : 'צור'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}