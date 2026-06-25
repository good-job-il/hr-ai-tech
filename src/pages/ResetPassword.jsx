import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ backgroundColor: '#eaf7fb' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">עב</div>
          <h1 className="text-xl font-bold text-gray-900">סיסמה חדשה</h1>
          <p className="text-sm text-gray-500 mt-1">הזן את הסיסמה החדשה שלך</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-gray-700">סיסמה חדשה</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1" dir="ltr" />
          </div>
          <div>
            <Label className="text-sm text-gray-700">אימות סיסמה</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1" dir="ltr" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-semibold">
            {loading ? 'מאפס...' : 'אפס סיסמה'}
          </Button>
          <p className="text-center">
            <Link to="/login" className="text-blue-600 text-sm hover:underline">חזרה להתחברות</Link>
          </p>
        </form>
      </div>
    </div>
  );
}