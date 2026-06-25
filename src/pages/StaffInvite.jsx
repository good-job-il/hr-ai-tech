import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES = [
  { id: 'recruiter', label: 'רכז גיוס' },
  { id: 'team_manager', label: 'מנהל צוות' },
  { id: 'recruitment_manager', label: 'מנהל גיוס' },
];

export default function StaffInvite() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('recruiter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const inviteToken = Math.random().toString(36).substring(2, 15);
      const inviteLink = `${window.location.origin}/register?invite=${inviteToken}&email=${encodeURIComponent(email)}&role=${role}&phone=${encodeURIComponent(phone)}`;

      // שמור הזמנה בדטאבייס אם יש כזה
      // await base44.entities.StaffInvite.create({...})

      // בעתיד: שלח אימייל עם הקישור
      console.log('Invite link:', inviteLink);

      setSuccess(true);
      setEmail('');
      setFullName('');
      setPhone('');
      
      // הצג הודעה עם הקישור לעיתוי עתידי
      alert(`הזמנה שנוצרה. קישור:\n${inviteLink}`);
    } catch (err) {
      setError(err.message || 'שגיאה בשליחת הזמנה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ background: 'linear-gradient(135deg, #eaf7fb 0%, #d4edfa 100%)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              הזמן עובד לצוות
            </h1>
            <p className="text-sm text-gray-600">
              הזמן עובדים חדשים כדי להצטרף לארגון שלך
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-6">
              הזמנה נשלחה בהצלחה!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 block mb-2">שם מלא</Label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 border-gray-300"
                placeholder="שם העובד"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 block mb-2">אימייל</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-gray-300"
                placeholder="worker@example.com"
                dir="ltr"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 block mb-2">טלפון</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11 border-gray-300"
                placeholder="05X-XXX-XXXX"
                dir="ltr"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 block mb-2">תפקיד</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 font-bold text-base rounded-lg">
              {loading ? 'שולח...' : 'שלח הזמנה'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}