import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { CreditCard } from 'lucide-react';

export default function AdminFinances() {
  return (
    <AdminLayout>
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">כספים</h1>
        <p className="text-gray-500 text-sm">עמוד זה בפיתוח</p>
        <span className="mt-4 px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">בקרוב</span>
      </div>
    </AdminLayout>
  );
}