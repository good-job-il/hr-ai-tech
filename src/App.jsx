import { queryClientInstance } from "@/lib/query-client"
import { useAuth } from "@/lib/AuthContext"

// Infrastructure

// ── Layouts ──────────────────────────────────────────────────────────
// Legacy layouts kept for /employer/* route

// ── Public Pages ──────────────────────────────────────────────────────

// ── Shared Feature Pages ──────────────────────────────────────────────

// ── Platform Pages (Super Admin) ──────────────────────────────────────

// ── Agency Pages (Staffing Agency) ────────────────────────────────────

// ── Company Pages (Company HR) ────────────────────────────────────────

// ── Candidate Pages ───────────────────────────────────────────────────

// ── Employer Pages (legacy) ───────────────────────────────────────────

// ── Placeholder ───────────────────────────────────────────────────────

// TODO: Ask Rudik about this component
// import AdminDashboard from "./pages/admin/AdminDashboard.jsx"

const AgencyDashboardRoute = () => {
  const { user } = useAuth()

  return user?.role === "recruitment_manager" ? (
    <RecruitmentManagerDashboard />
  ) : (
    <AgencyDashboard />
  )
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth()

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "#F7FBFF" }}
      >
        <div className="w-8 h-8 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    )
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />
    }

    if (authError.type === "auth_required") {
      navigateToLogin()

      return null
    }
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

          <Route
            path="/platform/organizations"
            element={<Navigate to="/platform/organizations/staffing" replace />}
          />

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
      <Route element={<ProtectedRoute requiredRoles={["org_admin"]} />}>
        <Route path="/agency/onboarding" element={<AgencyOnboarding />} />
      </Route>

      {/* ── STAFFING AGENCY — Admin / Recruitment Manager / Team Manager ── */}
      <Route
        element={
          <ProtectedRoute
            requiredRoles={["org_admin", "recruitment_manager", "team_manager"]}
            requiredOrgTypes={["staffing_agency"]}
            noOrgRedirect="/agency/onboarding"
          />
        }
      >
        <Route element={<StaffingAgencyLayout />}>
          {/* Organization-wide operational routes. */}
          <Route element={<ProtectedRoute requiredRoles={["org_admin", "recruitment_manager"]} />}>
            <Route path="/agency/dashboard" element={<AgencyDashboardRoute />} />

            <Route path="/agency/jobs" element={<ManageJobsPage />} />

            <Route path="/agency/jobs/open" element={<ManageJobsPage />} />

            <Route path="/agency/jobs/filled" element={<ManageJobsPage />} />

            <Route path="/agency/jobs/hold" element={<ManageJobsPage />} />

            <Route
              path="/agency/crm"
              element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />}
            />

            <Route
              path="/agency/crm/all"
              element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />}
            />

            <Route
              path="/agency/crm/active"
              element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />}
            />

            <Route
              path="/agency/crm/pipeline"
              element={<CandidateListCRMPage candidateRoute="/agency/crm/candidate" />}
            />

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

          {/* Recruitment Manager can inspect settings, but all controls remain Org Admin-only. */}
          <Route element={<ProtectedRoute requiredRoles={["org_admin", "recruitment_manager"]} />}>
            <Route path="/agency/settings/permissions" element={<PermissionsPage />} />

            <Route path="/agency/settings/roles" element={<RoleSettingsPage />} />

            <Route path="/agency/settings/billing" element={<BillingSettings />} />

            <Route path="/agency/settings/integrations" element={<IntegrationsSettings />} />
          </Route>

          {/* Team Manager cannot expand access through a direct organization URL. */}
          <Route element={<ProtectedRoute requiredRoles={["team_manager"]} />}>
            <Route path="/agency/team" element={<Navigate to="/agency/team/dashboard" replace />} />

            <Route
              path="/agency/team/dashboard"
              element={<RecruitmentManagerDashboard teamMode />}
            />

            <Route path="/agency/team/roster" element={<TeamRosterPage />} />

            <Route path="/agency/team/jobs" element={<ManageJobsPage />} />

            <Route path="/agency/team/jobs/open" element={<ManageJobsPage />} />

            <Route path="/agency/team/jobs/filled" element={<ManageJobsPage />} />

            <Route path="/agency/team/jobs/hold" element={<ManageJobsPage />} />

            <Route
              path="/agency/team/crm"
              element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />}
            />

            <Route
              path="/agency/team/crm/all"
              element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />}
            />

            <Route
              path="/agency/team/crm/active"
              element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />}
            />

            <Route
              path="/agency/team/crm/pipeline"
              element={<CandidateListCRMPage candidateRoute="/agency/team/crm/candidate" />}
            />

            <Route path="/agency/team/crm/candidate" element={<CandidateCRMPage />} />

            <Route path="/agency/team/pipeline" element={<PipelinePage />} />

            <Route path="/agency/team/compensation" element={<CompensationPage />} />

            <Route path="/agency/team/ai-matching" element={<AIMatchingPage />} />

            <Route path="/agency/team/import" element={<ImportDashboard />} />

            <Route path="/agency/team/reports" element={<AgencyReportsPage />} />

            <Route path="/agency/team/activity" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      {/* ── STAFFING AGENCY — Recruiter ────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute requiredRoles={["recruiter"]} requiredOrgTypes={["staffing_agency"]} />
        }
      >
        <Route element={<AgencyRecruiterLayout />}>
          <Route
            path="/agency/recruiter/dashboard"
            element={<PlaceholderPage title="דשבורד מגייס" />}
          />

          <Route
            path="/agency/recruiter/candidates"
            element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />}
          />

          <Route
            path="/agency/recruiter/candidates/all"
            element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />}
          />

          <Route
            path="/agency/recruiter/candidates/active"
            element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />}
          />

          <Route
            path="/agency/recruiter/candidates/pipeline"
            element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />}
          />

          <Route path="/agency/recruiter/jobs" element={<Jobs />} />

          <Route
            path="/agency/recruiter/crm"
            element={<CandidateListCRMPage candidateRoute="/agency/recruiter/crm/candidate" />}
          />

          <Route path="/agency/recruiter/crm/candidate" element={<CandidateCRMPage />} />

          <Route path="/agency/recruiter/pipeline" element={<PipelinePage />} />

          <Route path="/agency/recruiter/ai-matching" element={<AIMatchingPage />} />

          {/* Legacy redirects */}
          <Route
            path="/recruiter/*"
            element={<Navigate to="/agency/recruiter/dashboard" replace />}
          />
        </Route>
      </Route>

      {/* ── COMPANY HR — Admin / HR Manager ────────────────────────── */}
      <Route
        element={
          <ProtectedRoute
            requiredRoles={["org_admin", "hr_manager"]}
            requiredOrgTypes={["organization"]}
          />
        }
      >
        <Route element={<CompanyHRLayout />}>
          <Route path="/company/dashboard" element={<CompanyDashboard />} />

          <Route path="/company/jobs" element={<ManageJobsPage />} />

          <Route path="/company/jobs/all" element={<ManageJobsPage />} />

          <Route path="/company/jobs/active" element={<ManageJobsPage />} />

          <Route path="/company/jobs/closed" element={<ManageJobsPage />} />

          <Route
            path="/company/candidates"
            element={<CandidateListCRMPage candidateRoute="/company/crm/candidate" />}
          />

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
      <Route
        element={
          <ProtectedRoute
            requiredRoles={["internal_recruiter"]}
            requiredOrgTypes={["organization"]}
          />
        }
      >
        <Route element={<CompanyHRLayout />}>
          <Route
            path="/company/recruiter/dashboard"
            element={<PlaceholderPage title="דשבורד מגייס פנימי" />}
          />

          <Route path="/company/recruiter/jobs" element={<ManageJobsPage />} />

          <Route
            path="/company/recruiter/candidates"
            element={<CandidateListCRMPage candidateRoute="/company/recruiter/crm/candidate" />}
          />

          <Route path="/company/recruiter/crm/candidate" element={<CandidateCRMPage />} />

          <Route
            path="/company/recruiter/interviews"
            element={<PlaceholderPage title="ראיונות" />}
          />

          <Route path="/company/recruiter/ai-matching" element={<AIMatchingPage />} />
        </Route>
      </Route>

      {/* ── CANDIDATE ───────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute requiredRoles={["candidate"]} />}>
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
      <Route element={<ProtectedRoute requiredRoles={["employer"]} />}>
        <Route element={<EmployerLayout />}>
          <Route path="/employer/dashboard" element={<EmployerDashboard />} />

          <Route path="/employer/jobs" element={<ManageJobsPage />} />

          <Route path="/employer/jobs/all" element={<ManageJobsPage />} />

          <Route path="/employer/jobs/active" element={<ManageJobsPage />} />

          <Route path="/employer/jobs/closed" element={<ManageJobsPage />} />

          <Route
            path="/employer/candidates"
            element={<CandidateListCRMPage candidateRoute="/employer/crm/candidate" />}
          />

          <Route
            path="/employer/candidates/all"
            element={<CandidateListCRMPage candidateRoute="/employer/crm/candidate" />}
          />

          <Route path="/employer/pipeline" element={<PipelinePage />} />

          <Route path="/employer/ai-matching" element={<AIMatchingPage />} />

          <Route
            path="/employer/crm"
            element={<CandidateListCRMPage candidateRoute="/employer/crm/candidate" />}
          />

          <Route path="/employer/crm/candidate" element={<CandidateCRMPage />} />

          <Route path="/employer/analytics" element={<EmployerAnalyticsPage />} />

          <Route path="/employer/settings" element={<EmployerSettingsPage />} />
        </Route>
      </Route>

      {/* ── FALLBACK ────────────────────────────────────────────────── */}
      <Route path="*" element={<RoleFallback />} />
    </Routes>
  )
}

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
  )
}

export default App
