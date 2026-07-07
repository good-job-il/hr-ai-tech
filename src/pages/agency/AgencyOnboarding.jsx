import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { organizationsApi } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

/**
 * AgencyOnboarding
 *
 * Landing step for an org_admin who has registered/logged in but doesn't
 * belong to an organization yet. They must create their staffing agency
 * here before they can reach any /agency/* route — ProtectedRoute redirects
 * here automatically (see `noOrgRedirect` on the agency route group in
 * App.jsx) instead of showing "unauthorized".
 */
export default function AgencyOnboarding() {
  const { i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const navigate = useNavigate();
  const { organization, isLoadingAuth, checkUserAuth } = useAuth();

  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already onboarded (has an org) — nothing to do here, go straight in.
  useEffect(() => {
    if (!isLoadingAuth && organization) {
      navigate('/agency/dashboard', { replace: true });
    }
  }, [isLoadingAuth, organization, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(isRtl ? 'יש להזין שם לחברת ההשמה' : 'Please enter your agency name');
      return;
    }

    setLoading(true);
    try {
      await organizationsApi.onboardAgency({
        name: name.trim(),
        contact_email: contactEmail.trim() || undefined,
      });

      // Refresh auth context so `organization` / `orgType` reflect the new
      // agency before we navigate into the gated /agency/* routes.
      await checkUserAuth();
      navigate('/agency/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || (isRtl ? 'שגיאה ביצירת הארגון' : 'Error creating organization');
      setError(msg);
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F7FBFF]">
        <div className="w-8 h-8 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir={isRtl ? 'rtl' : 'ltr'} style={{ background: 'linear-gradient(135deg, #eaf7fb 0%, #d4edfa 100%)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎯</div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {isRtl ? 'הקמת חברת ההשמה שלך' : 'Set up your staffing agency'}
            </h1>
            <p className="text-sm text-gray-600">
              {isRtl
                ? 'עוד צעד אחד קטן — הקם את הארגון שלך כדי להתחיל לגייס'
                : 'One last step — create your organization to start recruiting'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6 flex gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 block mb-2">
                {isRtl ? 'שם חברת ההשמה' : 'Agency name'}
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 border-gray-300"
                placeholder={isRtl ? 'לדוגמה: השמה פרו בע"מ' : 'e.g. Acme Staffing Ltd.'}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 block mb-2">
                {isRtl ? 'אימייל ליצירת קשר (אופציונלי)' : 'Contact email (optional)'}
              </Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="h-11 border-gray-300"
                placeholder="agency@example.com"
                dir="ltr"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-bold text-base rounded-lg">
              {loading
                ? (isRtl ? 'יוצר ארגון...' : 'Creating organization...')
                : (isRtl ? 'צור את הארגון שלי' : 'Create my organization')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}


