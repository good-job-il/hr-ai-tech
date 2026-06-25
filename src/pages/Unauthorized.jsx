import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const ROLE_HOME = {
  admin: '/platform/dashboard',
  super_admin: '/platform/dashboard',
  org_admin: '/agency/dashboard',
  recruitment_manager: '/agency/dashboard',
  team_manager: '/agency/team/dashboard',
  recruiter: '/agency/recruiter/dashboard',
  hr_manager: '/company/dashboard',
  internal_recruiter: '/company/recruiter/dashboard',
  employer: '/employer/dashboard',
  candidate: '/candidate/dashboard',
};

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log(user, "user")
  const homeRoute = ROLE_HOME[user?.role] || '/';

  console.log(homeRoute, "homeRoute")

  const handleGoBack = () => {
    navigate(homeRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EFFF] via-[#F7FBFF] to-[#FFFFFF] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-[#0F172A] mb-3">גישה מוגבלת111</h1>
        <p className="text-lg text-[#64748B] mb-8">
          אין לך הרשאות לגשת לעמוד זה. אם אתה חושב שזה טעות, צור קשר עם המנהל.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-2xl text-white font-black text-base transition-all w-full"
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #6C4DFF 48%, #2F80FF 100%)',
              boxShadow: '0 18px 42px rgba(108, 77, 255, 0.35)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            חזרה לדשבורד
          </button>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-2xl text-[#6C4DFF] font-black text-base bg-white border border-[#DDEBFF] transition-all hover:bg-[#F3EFFF]"
          >
            התחברות עם חשבון אחר
          </Link>
        </div>
      </div>
    </div>
  );
}
