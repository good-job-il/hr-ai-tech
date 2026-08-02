import { useState, useEffect } from 'react';
import { authService } from '@/api/services/authService';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Mail, Phone, User, Save, Check } from 'lucide-react';

export default function EmployerSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notification_email: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm(f => ({
      ...f,
      contact_name: user.full_name || '',
      contact_email: user.email || '',
      notification_email: user.email || '',
    }));
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await authService.updateMe({
        full_name: form.contact_name,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const field = (label, icon, key, type = 'text', readOnly = false) => (
    <div>
      <label className="block text-sm font-bold text-[#374151] mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</span>
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          readOnly={readOnly}
          className={`w-full h-11 pr-10 pl-4 rounded-xl border text-sm outline-none transition-all ${
            readOnly
              ? 'border-[#E4ECFF] bg-[#F7FBFF] text-[#94A3B8] cursor-not-allowed'
              : 'border-[#E4ECFF] bg-white text-[#0F172A] focus:border-[#7C3AED]'
          }`}
        />
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A]">הגדרות</h1>
        <p className="text-[#64748B] font-semibold mt-1">פרטי החברה ויצירת קשר</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4ECFF] p-6 space-y-5">
        <h2 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#7C3AED]" /> פרטי חברה
        </h2>

        {field('שם איש קשר', <User className="w-4 h-4" />, 'contact_name')}
        {field('אימייל', <Mail className="w-4 h-4" />, 'contact_email', 'email', true)}
        {field('טלפון', <Phone className="w-4 h-4" />, 'contact_phone', 'tel')}
        {field('אימייל לקבלת עדכונים על מועמדים', <Mail className="w-4 h-4" />, 'notification_email', 'email')}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="h-11 px-6 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm flex items-center gap-2 shadow-md hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saved ? <><Check className="w-4 h-4" /> נשמר!</> : <><Save className="w-4 h-4" /> שמור שינויים</>}
          </button>
        </div>
      </div>

      <div className="bg-[#F7FBFF] rounded-2xl border border-[#E4ECFF] p-6">
        <h2 className="text-base font-black text-[#64748B] mb-2">מידע על חשבונך</h2>
        <div className="space-y-2 text-sm text-[#64748B]">
          <div className="flex justify-between">
            <span>אימייל:</span>
            <span className="font-bold text-[#0F172A]">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span>תפקיד:</span>
            <span className="font-bold text-[#0F172A]">מעסיק</span>
          </div>
        </div>
      </div>
    </div>
  );
}
