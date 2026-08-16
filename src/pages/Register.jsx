import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '@/api/services/authService';
import { agencyTeamsService } from '@/api/services/agencyTeamsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { toast } from '@/components/ui/use-toast';

export default function Register() {
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');

  const USER_TYPES = [
    { id: 'candidate', label: isRtl ? 'מועמד (מחפש עבודה)' : 'Candidate (Job Seeker)', requiresOrg: false },
    { id: 'employer', label: isRtl ? 'מעסיק (חברה)' : 'Employer (Company)', requiresOrg: true },
    { id: 'org_admin', label: isRtl ? 'בעל חברה / אדמין' : 'Company Owner / Admin', requiresOrg: true },
  ];

  const ORG_TYPES = [
    {
      id: 'organization',
      label: isRtl ? 'ארגון / חברה רגילה' : 'Regular Organization / Company',
      desc: isRtl ? 'גיוס עצמאי ללא מערכת תגמולים פנימית' : 'Independent hiring without internal compensation system',
      icon: '🏢',
    },
    {
      id: 'staffing_agency',
      label: isRtl ? 'חברת השמה / כוח אדם' : 'Staffing Agency',
      desc: isRtl ? 'כולל מערכת תגמולים, עמלות וניהול היררכי' : 'Includes compensation, commissions and hierarchical management',
      icon: '🎯',
    },
  ];

  const urlParams = new URLSearchParams(window.location.search);
  const phoneFromUrl = urlParams.get('phone') || '';
  const inviteToken = urlParams.get('invite') || '';
  const inviteEmail = urlParams.get('email') || '';
  const inviteRole = urlParams.get('role') || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(inviteEmail);
  const [phone, setPhone] = useState(phoneFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState(inviteRole || 'candidate');
  const [orgType, setOrgType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isFromInvite = !!inviteToken;

  const cardRef = useRef(null);

  const showError = (msg) => {
    setError(msg);
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast({ title: msg, variant: 'destructive' });
  };

  const selectedUserType = USER_TYPES.find(u => u.id === userType);
  const requiresOrg = selectedUserType?.requiresOrg;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFromInvite && !fullName.trim()) {
      showError(isRtl ? 'יש להזין שם מלא' : 'Please enter your full name');
      return;
    }
    if (!isFromInvite && !email.trim()) {
      showError(isRtl ? 'יש להזין כתובת אימייל' : 'Please enter your email');
      return;
    }
    if (!isFromInvite && !phone.trim()) {
      showError(isRtl ? 'יש להזין מספר טלפון' : 'Please enter your phone number');
      return;
    }
    if (password !== confirmPassword) {
      showError(t('errors.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      showError(isRtl ? 'הסיסמה חייבת להיות לפחות 8 תווים' : 'Password must be at least 8 characters');
      return;
    }
    if (requiresOrg && !orgType) {
      showError(isRtl ? 'יש לבחור סוג ארגון' : 'Please select an organization type');
      return;
    }

    setLoading(true);
    try {
      if (isFromInvite) {
        const member = await agencyTeamsService.acceptInvitation(inviteToken, password);
        await authService.login(member.email, password);
        window.location.href = member.role === 'recruiter'
          ? '/agency/recruiter/dashboard'
          : member.role === 'team_manager'
            ? '/agency/team/dashboard'
            : '/agency/dashboard';
        return;
      }
      await authService.register({
        email,
        password,
        full_name: fullName,
        phone,
        role: userType,
      });

      // Set org_type separately — not part of the core register payload
      if (requiresOrg && orgType) {
        try {
          await authService.updateMe({ org_type: orgType });
        } catch (updateErr) {
          console.warn('[Register] updateMe(org_type) failed:', updateErr);
        }
      }

      localStorage.setItem('registered_role', userType);

      const redirects = {
        candidate: '/candidate/dashboard',
        employer: '/employer/dashboard',
        recruiter: '/recruiter/dashboard',
        team_manager: '/recruitment/jobs',
        recruitment_manager: '/recruitment/jobs',
        // org_admin never has an organization yet at this point — send
        // straight to onboarding for the org type they picked. Staffing
        // agencies self-onboard immediately; company org_admins land on
        // their dashboard (company creation is handled separately/by admin).
        org_admin: orgType === 'organization' ? '/company/dashboard' : '/agency/onboarding',
      };

      window.location.href = redirects[userType] || '/';
    } catch (err) {
      console.error('[Register] register error:', err);
      const msg = err?.response?.data?.message || err?.message || (isRtl ? 'שגיאה בהרשמה' : 'Registration error');
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir={isRtl ? 'rtl' : 'ltr'} style={{ background: 'linear-gradient(135deg, #eaf7fb 0%, #d4edfa 100%)' }}>
      <div className="w-full max-w-md">
        <div ref={cardRef} className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="HeadHunter HR-Tech" className="h-16 w-auto object-contain mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {isRtl ? 'הצטרף לHeadHunter' : 'Join HeadHunter'}
            </h1>
            <p className="text-sm text-gray-600">
              {isRtl ? 'אלפי משרות מחכות לך — הרשמה לוקחת פחות מדקה' : 'Thousands of jobs await you — registration takes less than a minute'}
            </p>
          </div>

          <div className="flex justify-center mb-4">
            <LanguageSwitcher variant="badge" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6 flex gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <>
             <form onSubmit={handleRegister} className="space-y-4">
               {!isFromInvite && <div>
                 <Label className="text-sm font-semibold text-gray-700 block mb-2">{t('auth.register.fullName')}</Label>
                 <Input
                   type="text"
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   required
                   className="h-11 border-gray-300"
                   placeholder={isRtl ? 'ישראל ישראלי' : 'John Smith'}
                 />
               </div>}
               {!isFromInvite && <div>
                 <Label className="text-sm font-semibold text-gray-700 block mb-2">{t('auth.register.email')}</Label>
                 <Input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="h-11 border-gray-300"
                   placeholder="you@example.com"
                   dir="ltr"
                 />
               </div>}
               {!isFromInvite && <div>
                 <Label className="text-sm font-semibold text-gray-700 block mb-2">{t('auth.register.phone')}</Label>
                 <Input
                   type="tel"
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                   required
                   className="h-11 border-gray-300"
                   placeholder="05X-XXX-XXXX"
                   dir="ltr"
                 />
               </div>}
               {!isFromInvite && (
                 <div>
                   <Label className="text-sm font-semibold text-gray-700 block mb-2">
                     {isRtl ? 'אני מצטרף בתור' : 'I am joining as'}
                   </Label>
                   <Select value={userType} onValueChange={(v) => { setUserType(v); setOrgType(''); }}>
                     <SelectTrigger className="h-11 border-gray-300">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {USER_TYPES.map(type => (
                         <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}

               {isFromInvite && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                   <p className="font-semibold mb-1">
                     {isRtl ? 'הצטרפות לארגון באמצעות הזמנה' : 'Joining an organization by invitation'}
                   </p>
                   <p className="text-xs text-blue-700">
                     {isRtl ? 'הארגון והתפקיד נקבעו באופן מאובטח בהזמנה' : 'Your organization and role are securely defined by the invitation'}
                   </p>
                 </div>
               )}

               {requiresOrg && !isFromInvite && (
                 <div>
                   <Label className="text-sm font-semibold text-gray-700 block mb-2">
                     {isRtl ? 'סוג הארגון' : 'Organization type'}
                   </Label>
                   <div className="grid grid-cols-2 gap-3">
                     {ORG_TYPES.map(org => (
                       <button
                         key={org.id}
                         type="button"
                         onClick={() => setOrgType(org.id)}
                         className={`p-3 rounded-xl border-2 text-${isRtl ? 'right' : 'left'} transition-all ${
                           orgType === org.id
                             ? 'border-purple-500 bg-purple-50'
                             : 'border-gray-200 hover:border-gray-300 bg-white'
                         }`}
                       >
                         <div className="text-xl mb-1">{org.icon}</div>
                         <div className="text-xs font-bold text-gray-800">{org.label}</div>
                         <div className="text-[10px] text-gray-500 mt-0.5">{org.desc}</div>
                       </button>
                     ))}
                   </div>
                 </div>
               )}
               <div>
                 <Label className="text-sm font-semibold text-gray-700 block mb-2">{t('auth.register.password')}</Label>
                 <Input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   className="h-11 border-gray-300"
                   placeholder="••••••••"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   {isRtl ? 'לפחות 6 תווים — בחר משהו שתזכור' : 'At least 6 characters — choose something you remember'}
                 </p>
               </div>
               <div>
                 <Label className="text-sm font-semibold text-gray-700 block mb-2">{t('auth.register.confirmPassword')}</Label>
                 <Input
                   type="password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   required
                   className="h-11 border-gray-300"
                   placeholder="••••••••"
                 />
               </div>
               <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-bold text-base rounded-lg">
                 {loading ? (
                   <span className="flex items-center gap-2 justify-center">
                     <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                     </svg>
                     {t('auth.register.registering')}
                   </span>
                 ) : t('auth.register.registerButton')}
               </Button>
             </form>

            </>

          <p className="text-center text-sm text-gray-600 mt-7">
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="text-hhblue font-bold hover:underline">{t('auth.register.loginLink')}</Link>
          </p>
        </div>

        <div className="mt-8 text-center space-y-2 text-xs text-gray-500">
          <p>🔒 {isRtl ? 'הנתונים שלך מוצפנים ומאובטחים' : 'Your data is encrypted and secure'}</p>
          <p>✓ {isRtl ? 'בנוי עבור מחפשי עבודה ומעסיקים בישראל' : 'Built for job seekers and employers in Israel'}</p>
        </div>
      </div>
    </div>
  );
}
