import { Toaster } from "@/components/ui/toaster"
import LanguageProvider from '@/lib/LanguageProvider'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import RoleFallback from './lib/RoleFallback';
import Unauthorized from './pages/Unauthorized';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/lib/ProtectedRoute';
import PermissionRoute from '@/lib/PermissionRoute';

// Infrastructure
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { ModalContainer } from '@/components/dialogs/ModalContainer';
import { DrawerContainer } from '@/components/dialogs/DrawerContainer';
import { ToastContainer } from '@/components/notifications/ToastContainer';

// ── Layouts ──────────────────────────────────────────────────────────
import CandidateLayout from '@/components/layouts/CandidateLayout';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import StaffingAgencyLayout from '@/components/layouts/StaffingAgencyLayout';
import CompanyHRLayout from '@/components/layouts/CompanyHRLayout';
import AgencyRecruiterLayout from '@/components/layouts/AgencyRecruiterLayout';
// Legacy layouts kept for /employer/* route
import EmployerLayout from '@/components/layouts/EmployerLayout';

// ── Public Pages ──────────────────────────────────────────────────────
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Companies from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import PricingPage from './pages/public/PricingPage';
import ContactPage from './pages/public/ContactPage';
import AboutPage from './pages/public/AboutPage';
import BlogPage from './pages/public/BlogPage';
import AICareerPage from './pages/public/AICareerPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import ResourcesPage from './pages/public/ResourcesPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StaffInvite from './pages/StaffInvite';

// ── Shared Feature Pages ──────────────────────────────────────────────
import PipelinePage from './pages/recruitment/PipelinePage';
import AIMatchingPage from './pages/ai/AIMatchingPage';
import CandidateCRMPage from './pages/crm/CandidateCRMPage';
import CandidateListCRMPage from './pages/crm/CandidateListCRMPage';
import ImportDashboard from './pages/admin/ImportDashboard';
import ManageJobsPage from './pages/admin/ManageJobsPage';
import CompensationPage from './pages/admin/CompensationPage';
import PermissionsPage from './pages/admin/PermissionsPage';
import RoleSettingsPage from './pages/admin/RoleSettingsPage';
import BillingSettings from './pages/admin/BillingSettings';
import IntegrationsSettings from './pages/admin/IntegrationsSettings';
import AuditLogPage from './pages/admin/AuditLogPage';

// ── Platform Pages (Super Admin) ──────────────────────────────────────
import PlatformDashboard from './pages/platform/PlatformDashboard';
import PlaceholderPlatform from './pages/platform/PlaceholderPlatform';
import SubscriptionsPage from './pages/platform/SubscriptionsPage';
import InvoicesPage from './pages/platform/InvoicesPage';
import FlagsPage from './pages/platform/FlagsPage';
import OrganizationsPage from './pages/platform/OrganizationsPage';
import UsersManagementPage from './pages/platform/UsersManagementPage';
import MarketplacePage from './pages/platform/marketplace/MarketplacePage';
import MarketplaceCandidatesPage from './pages/platform/marketplace/MarketplaceCandidatesPage';
import MarketplaceExposurePage from './pages/platform/marketplace/MarketplaceExposurePage';

// ── Agency Pages (Staffing Agency) ────────────────────────────────────
import AgencyDashboard from './pages/agency/AgencyDashboard';
import AgencyOnboarding from './pages/agency/AgencyOnboarding';
import AgencyClients from './pages/agency/AgencyClients';
import AgencyClientDetail from './pages/agency/AgencyClientDetail';
import AgencyTeamsPage from './pages/agency/AgencyTeamsPage';

// ── Company Pages (Company HR) ────────────────────────────────────────
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyInterviews from './pages/company/CompanyInterviews';
import CompanyTeamPage from './pages/company/CompanyTeamPage';
import CompanyAnalyticsPage from './pages/company/CompanyAnalyticsPage';

// ── Candidate Pages ───────────────────────────────────────────────────
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateProfile from './pages/candidate/CandidateProfile';
import CandidateApplications from './pages/candidate/CandidateApplications';
import CandidateSavedJobs from './pages/candidate/CandidateSavedJobs';
import CandidateInterviews from './pages/candidate/CandidateInterviews';
import CandidateMessages from './pages/candidate/CandidateMessages';
import Notifications from './pages/Notifications';
import RecommendedJobsAI from './components/home/RecommendedJobsAI';

// ── Employer Pages (legacy) ───────────────────────────────────────────
import EmployerDashboard from './pages/employer/EmployerDashboard';
import EmployerAnalyticsPage from './pages/employer/EmployerAnalyticsPage';
import EmployerSettingsPage from './pages/employer/EmployerSettingsPage';

// ── Placeholder ───────────────────────────────────────────────────────
import PlaceholderPage from './pages/placeholder/PlaceholderPage';
import AgencyReportsPage from './pages/agency/AgencyReportsPage';

// TODO: Ask Rudik about this component
// import AdminDashboard from "./pages/admin/AdminDashboard.jsx"

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#F7FBFF' }}>
        <div className="w-8 h-8 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      {/* ── PUBLIC ─────────────────────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/staff-invite" element={<StaffInvite />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Home />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/companies/:id" element={<CompanyProfile />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/ai-career" element={<AICareerPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/resources" element={<ResourcesPage />} />

      {/* ── PLATFORM (Admin ONLY) ─────────────────────────────────────── */}
      {/* ALL platform routes require admin role — no org access */}
      <Route element={<ProtectedRoute superAdminOnly />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/platform/dashboard" element={<PlatformDashboard />} />
          <Route path="/platform/organizations" element={<Navigate to="/platform/organizations/staffing" replace />} />
          <Route path="/platform/organizations/staffing" element={<OrganizationsPage />} />
          <Route path="/platform/organizations/companies" element={<OrganizationsPage />} />
          <Route path="/platform/billing" element={<SubscriptionsPage />} />
          <Route path="/platform/billing/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/platform/billing/invoices" element={<InvoicesPage />} />
          <Route path="/platform/billing/flags" element={<FlagsPage />} />
          <Route path="/platform/marketplace" element={<MarketplacePage />} />
          <Route path="/platform/marketplace/candidates" element={<MarketplaceCandidatesPage />} />
          <Route path="/platform/marketplace/exposure" element={<MarketplaceExposurePage />} />
          <Route path="/platform/analytics" element={<PlaceholderPlatform />} />
          <Route path="/platform/analytics/users" element={<UsersManagementPage />} />
          <Route path="/platform/analytics/ai" element={<PlaceholderPlatform />} />
          <Route path="/platform/analytics/parsing" element={<PlaceholderPlatform />} />
          <Route path="/platform/analytics/integrations" element={<PlaceholderPlatform />} />
          <Route path="/platform/security" element={<PlaceholderPlatform />} />
          <Route path="/platform/security/audit" element={<AuditLogPage />} />
          <Route path="/platform/security/permissions" element={<PlaceholderPlatform />} />
          <Route path="/platform/security/deleted" element={<PlaceholderPlatform />} />
          <Route path="/platform/security/impersonation" element={<PlaceholderPlatform />} />
          <Route path="/platform/security/suspicious" element={<PlaceholderPlatform />} />
          <Route path="/platform/settings" element={<PlaceholderPlatform />} />
          <Route path="/platform/settings/templates" element={<PlaceholderPlatform />} />
          <Route path="/platform/settings/permissions" element={<PermissionsPage />} />
          <Route path="/platform/settings/roles" element={<RoleSettingsPage />} />
          <Route path="/platform/settings/ai" element={<PlaceholderPlatform />} />
          <Route path="/platform/settings/parsing" element={<PlaceholderPlatform />} />
          <Route path="/platform/impersonation" element={<PlaceholderPlatform />} />
          <Route path="/platform/impersonation/org" element={<PlaceholderPlatform />} />
          <Route path="/platform/impersonation/recruiter" element={<PlaceholderPlatform />} />
          <Route path="/platform/impersonation/support" element={<PlaceholderPlatform />} />
        </Route>
      </Route>

      {/* ── STAFFING AGENCY ONBOARDING — org_admin without an org yet ───── */}
      {/* No requiredOrgTypes here: the whole point is they don't have one. */}
      <Route element={<ProtectedRoute requiredRoles={['org_admin']} />}>
        <Route path="/agency/onboarding" element={<AgencyOnboarding />} />
      </Route>

      {/* ── STAFFING AGENCY — Admin / Recruitment Manager / Team Manager ── */}
      <Route element={<ProtectedRoute
        requiredRoles={['org_admin', 'recruitment_manager', 'team_manager']}
        requiredOrgTypes={['staffing_agency']}
        noOrgRedirect="/agency/onboarding"
      />}>
        <Route element={<StaffingAgencyLayout />}>
          {/* Organization-wide operational routes. */}
          <Route element={<ProtectedRoute requiredRoles={['org_admin', 'recruitment_manager']} />}>
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            <Route path="/agency/jobs" element={<ManageJobsPage />} />
            <Route path="/agency/jobs/open" element={<ManageJobsPage />} />
            <Route path="/agency/jobs/filled" element={<ManageJobsPage />} />
            <Route path="/agency/jobs/hold" element={<ManageJobsPage />} />
            <Route path="/agency/crm" element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />} />
            <Route path="/agency/crm/all" element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />} />
            <Route path="/agency/crm/active" element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />} />
            <Route path="/agency/crm/pipeline" element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />} />
            <Route path="/agency/crm/candidate" element={<CandidateCRMPage />} />
            <Route path="/agency/pipeline" element={<PipelinePage />} />
            <Route path="/agency/ai-matching" element={<AIMatchingPage />} />
            <Route path="/agency/compensation" element={<CompensationPage />} />
            <Route path="/agency/import" element={<ImportDashboard />} />
            <Route path="/agency/clients" element={<AgencyClients />} />
            <Route path="/agency/clients/:id" element={<AgencyClientDetail />} />
            <Route path="/agency/teams" element={<AgencyTeamsPage />} />
            <Route path="/agency/reports" element={<AgencyReportsPage />} />
            <Route path="/agency/activity" element={<AuditLogPage />} />
            <Route path="/recruitment/*" element={<Navigate to="/agency/dashboard" replace />} />
          </Route>

          {/* Organization configuration is Org Admin only until read-only views exist. */}
          <Route element={<ProtectedRoute requiredRoles={['org_admin']} />}>
            <Route element={<PermissionRoute required={['manage_settings']} />}>
              <Route path="/agency/settings/permissions" element={<PermissionsPage />} />
              <Route path="/agency/settings/roles" element={<RoleSettingsPage />} />
              <Route path="/agency/settings/billing" element={<BillingSettings />} />
              <Route path="/agency/settings/integrations" element={<IntegrationsSettings />} />
            </Route>
          </Route>

          {/* Team Manager cannot expand access through a direct organization URL. */}
          <Route element={<ProtectedRoute requiredRoles={['team_manager']} />}>
            <Route path="/agency/team/dashboard" element={<AgencyDashboard />} />
            <Route path="/agency/team/jobs" element={<ManageJobsPage />} />
            <Route path="/agency/team/crm" element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />} />
            <Route path="/agency/team/crm/all" element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />} />
            <Route path="/agency/team/crm/active" element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />} />
            <Route path="/agency/team/crm/pipeline" element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />} />
            <Route path="/agency/team/crm/candidate" element={<CandidateCRMPage />} />
            <Route path="/agency/team/pipeline" element={<PipelinePage />} />
            <Route path="/agency/team/compensation" element={<CompensationPage />} />
            <Route path="/agency/team/ai-matching" element={<AIMatchingPage />} />
            <Route path="/agency/team/import" element={<ImportDashboard />} />
            <Route path="/agency/team/reports" element={<AgencyReportsPage />} />
          </Route>
        </Route>
      </Route>

      {/* ── STAFFING AGENCY — Recruiter ────────────────────────────── */}
      <Route element={<ProtectedRoute
        requiredRoles={['recruiter']}
        requiredOrgTypes={['staffing_agency']}
      />}>
        <Route element={<AgencyRecruiterLayout />}>
          <Route path="/agency/recruiter/dashboard" element={<PlaceholderPage title="דשבורד מגייס" />} />
          <Route path="/agency/recruiter/candidates" element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />} />
          <Route path="/agency/recruiter/candidates/all" element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />} />
          <Route path="/agency/recruiter/candidates/active" element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />} />
          <Route path="/agency/recruiter/candidates/pipeline" element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />} />
          <Route path="/agency/recruiter/jobs" element={<Jobs />} />
          <Route path="/agency/recruiter/crm" element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />} />
          <Route path="/agency/recruiter/crm/candidate" element={<CandidateCRMPage />} />
          <Route path="/agency/recruiter/pipeline" element={<PipelinePage />} />
          <Route path="/agency/recruiter/ai-matching" element={<AIMatchingPage />} />
          {/* Legacy redirects */}
          <Route path="/recruiter/*" element={<Navigate to="/agency/recruiter/dashboard" replace />} />
        </Route>
      </Route>

      {/* ── COMPANY HR — Admin / HR Manager ────────────────────────── */}
      <Route element={<ProtectedRoute
        requiredRoles={['org_admin', 'hr_manager']}
        requiredOrgTypes={['organization']}
      />}>
        <Route element={<CompanyHRLayout />}>
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/jobs" element={<ManageJobsPage />} />
          <Route path="/company/jobs/all" element={<ManageJobsPage />} />
          <Route path="/company/jobs/active" element={<ManageJobsPage />} />
          <Route path="/company/jobs/closed" element={<ManageJobsPage />} />
          <Route path="/company/candidates" element={<CandidateListCRMPage candidateRoute="/company/crm/candidate" />} />
          <Route path="/company/crm/candidate" element={<CandidateCRMPage />} />
          <Route path="/company/interviews" element={<CompanyInterviews />} />
          <Route path="/company/ai-matching" element={<AIMatchingPage />} />
          <Route path="/company/team" element={<CompanyTeamPage />} />
          <Route path="/company/team/members" element={<CompanyTeamPage />} />
          <Route path="/company/team/recruiters" element={<CompanyTeamPage />} />
          <Route path="/company/analytics" element={<CompanyAnalyticsPage />} />
          <Route path="/company/settings/permissions" element={<PermissionsPage />} />
          <Route path="/company/settings/integrations" element={<IntegrationsSettings />} />
          <Route path="/company/settings/careers" element={<PlaceholderPage title="דף קריירה" />} />
          <Route path="/company/settings/billing" element={<BillingSettings />} />
        </Route>
      </Route>

      {/* ── COMPANY HR — Internal Recruiter ─────────────────────────── */}
      <Route element={<ProtectedRoute
        requiredRoles={['internal_recruiter']}
        requiredOrgTypes={['organization']}
      />}>
        <Route element={<CompanyHRLayout />}>
          <Route path="/company/recruiter/dashboard" element={<PlaceholderPage title="דשבורד מגייס פנימי" />} />
          <Route path="/company/recruiter/jobs" element={<ManageJobsPage />} />
          <Route path="/company/recruiter/candidates" element={<CandidateListCRMPage candidateRoute="/company/recruiter/crm/candidate" />} />
          <Route path="/company/recruiter/crm/candidate" element={<CandidateCRMPage />} />
          <Route path="/company/recruiter/interviews" element={<PlaceholderPage title="ראיונות" />} />
          <Route path="/company/recruiter/ai-matching" element={<AIMatchingPage />} />
        </Route>
      </Route>

      {/* ── CANDIDATE ───────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute requiredRoles={['candidate']} />}>
        <Route element={<CandidateLayout />}>
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate/profile" element={<CandidateProfile />} />
          <Route path="/candidate/jobs" element={<Jobs />} />
          <Route path="/candidate/jobs/all" element={<Jobs />} />
          <Route path="/candidate/jobs/recommended" element={<RecommendedJobsAI />} />
          <Route path="/candidate/jobs/saved" element={<CandidateSavedJobs />} />
          <Route path="/candidate/applications" element={<CandidateApplications />} />
          <Route path="/candidate/interviews" element={<CandidateInterviews />} />
          <Route path="/candidate/messages" element={<CandidateMessages />} />
          <Route path="/candidate/notifications" element={<Notifications />} />
        </Route>
      </Route>

      {/* ── EMPLOYER (legacy — backward compat redirects only) ──────── */}
      {/* NOTE: 'employer' role is kept for existing users migrating to new arch.   */}
      {/* No new features should be built on /employer/*. This is a compatibility   */}
      {/* bridge until employers are migrated to /company/* or /agency/* tenants.   */}
      <Route element={<ProtectedRoute requiredRoles={['employer']} />}>
        <Route element={<EmployerLayout />}>
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />
          <Route path="/employer/jobs" element={<ManageJobsPage />} />
          <Route path="/employer/jobs/all" element={<ManageJobsPage />} />
          <Route path="/employer/jobs/active" element={<ManageJobsPage />} />
          <Route path="/employer/jobs/closed" element={<ManageJobsPage />} />
          <Route path="/employer/candidates" element={<CandidateListCRMPage candidateRoute="/employer/crm/candidate" />} />
          <Route path="/employer/candidates/all" element={<CandidateListCRMPage candidateRoute="/employer/crm/candidate" />} />
          <Route path="/employer/pipeline" element={<PipelinePage />} />
          <Route path="/employer/ai-matching" element={<AIMatchingPage />} />
          <Route path="/employer/crm" element={<CandidateListCRMPage candidateRoute="/employer/crm/candidate" />} />
          <Route path="/employer/crm/candidate" element={<CandidateCRMPage />} />
          <Route path="/employer/analytics" element={<EmployerAnalyticsPage />} />
          <Route path="/employer/settings" element={<EmployerSettingsPage />} />
        </Route>
      </Route>

      {/* ── FALLBACK ────────────────────────────────────────────────── */}
      <Route path="*" element={<RoleFallback />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <AuthenticatedApp />
                <ModalContainer />
                <DrawerContainer />
                <ToastContainer />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
