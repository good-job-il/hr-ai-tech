# Legacy API inventory

Baseline generated: 2026-08-13.

This file is a human-readable snapshot. The enforceable per-file baseline is `legacy-api-call-baseline.json`.

## Counts

| Metric                | Count |
| --------------------- | ----: |
| importFiles           |    61 |
| callFiles             |    61 |
| calls                 |   177 |
| filterCalls           |    85 |
| usedFunctions         |    13 |
| unusedLegacyFunctions |    51 |
| entityConfig          |    40 |

## Dynamic filter contracts

| Entity              | Conditions expression                                                                         | Consumer                                                 |
| ------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Job                 | `{ is_closed: false }`                                                                        | `src/components/ai/CandidateRecommendationsPanel.jsx:22` |
| ApplicationTimeline | `{ application_id: applicationId }`                                                           | `src/components/applications/ApplicationTimeline.jsx:33` |
| ApplicationTimeline | `{ application_id: application.id }`                                                          | `src/components/ats/ActivityTimeline.jsx:47`             |
| ApplicationTimeline | `{ application_id: application.id }`                                                          | `src/components/ats/ActivityTimeline.jsx:56`             |
| Notification        | `{ recipient_email: user.email }`                                                             | `src/components/ats/NotificationCenter.jsx:32`           |
| AgencyClient        | `{ status: 'active' }`                                                                        | `src/components/employer/JobFormModal.jsx:49`            |
| Job                 | `{ is_closed: false }`                                                                        | `src/components/home/HeroSection.jsx:19`                 |
| Job                 | `{ employer_company_id: company.company_id, organization_id: orgId, is_deleted: false }`      | `src/pages/agency/AgencyClientDetail.jsx:492`            |
| Application         | `{ organization_id: orgId, employer_company_id: company.company_id, is_deleted: false }`      | `src/pages/agency/AgencyClientDetail.jsx:503`            |
| Job                 | `{ organization_id: orgId, is_deleted: false }`                                               | `src/pages/agency/AgencyDashboard.jsx:34`                |
| Candidate           | `{ organization_id: orgId, is_deleted: false }`                                               | `src/pages/agency/AgencyDashboard.jsx:42`                |
| Application         | `{ organization_id: orgId, is_deleted: false }`                                               | `src/pages/agency/AgencyDashboard.jsx:50`                |
| CompensationPlan    | `{ organization_id: orgId }`                                                                  | `src/pages/agency/AgencyDashboard.jsx:58`                |
| Candidate           | `getAgencyScopeFilter(user)`                                                                  | `src/pages/ai/AIMatchingPage.jsx:64`                     |
| Candidate           | `{ employer_id: user.email }`                                                                 | `src/pages/ai/AIMatchingPage.jsx:69`                     |
| Job                 | `jobFilter`                                                                                   | `src/pages/ai/AIMatchingPage.jsx:82`                     |
| Application         | `{ job_id: job.id, candidate_email: selectedCandidate.email }`                                | `src/pages/ai/AIMatchingPage.jsx:224`                    |
| Application         | `{ candidate_email: user.email }`                                                             | `src/pages/candidate/CandidateApplications.jsx:278`      |
| Interview           | `{ candidate_email: user.email }`                                                             | `src/pages/candidate/CandidateApplications.jsx:284`      |
| Application         | `{ candidate_email: user.email }`                                                             | `src/pages/candidate/CandidateDashboard.jsx:33`          |
| Interview           | `{ candidate_email: user.email, status: 'scheduled' }`                                        | `src/pages/candidate/CandidateDashboard.jsx:34`          |
| SavedJob            | `{ user_email: user.email }`                                                                  | `src/pages/candidate/CandidateDashboard.jsx:35`          |
| Job                 | `{ is_closed: false }`                                                                        | `src/pages/candidate/CandidateDashboard.jsx:36`          |
| Interview           | `{ candidate_email: user.email }`                                                             | `src/pages/candidate/CandidateInterviews.jsx:265`        |
| Message             | `{ application_id: application.id }`                                                          | `src/pages/candidate/CandidateMessages.jsx:59`           |
| Application         | `{ candidate_email: user.email }`                                                             | `src/pages/candidate/CandidateMessages.jsx:245`          |
| Message             | `{ application_id: app.id, is_read: false, }`                                                 | `src/pages/candidate/CandidateMessages.jsx:258`          |
| CandidateProfile    | `{ user_email: user.email }`                                                                  | `src/pages/candidate/CandidateProfile.jsx:112`           |
| SavedJob            | `{ user_email: user.email }`                                                                  | `src/pages/candidate/CandidateSavedJobs.jsx:101`         |
| Application         | `{ candidate_email: user.email }`                                                             | `src/pages/CandidateDashboard.jsx:14`                    |
| SavedJob            | `{ user_email: user.email }`                                                                  | `src/pages/CandidateDashboard.jsx:20`                    |
| CandidateProfile    | `{ user_email: user.email }`                                                                  | `src/pages/CandidateDashboard.jsx:27`                    |
| CandidateProfile    | `{ user_email: user.email }`                                                                  | `src/pages/CandidateProfile.jsx:18`                      |
| Application         | `{ employer_id: userEmail }`                                                                  | `src/pages/CandidateSearch.jsx:28`                       |
| CandidateProfile    | `{ is_public: true }`                                                                         | `src/pages/CandidateSearch.jsx:34`                       |
| Staff               | `{ organization_id: organization?.id }`                                                       | `src/pages/company/CompanyTeamPage.jsx:325`              |
| Company             | `{ id }`                                                                                      | `src/pages/CompanyProfile.jsx:32`                        |
| Job                 | `{ company: company?.name, is_closed: false }`                                                | `src/pages/CompanyProfile.jsx:38`                        |
| CompanyReview       | `{ company_id: id }`                                                                          | `src/pages/CompanyProfile.jsx:44`                        |
| Candidate           | `filter`                                                                                      | `src/pages/crm/CandidateListCRMPage.jsx:69`              |
| Job                 | `{ employer_id: employerId, is_closed: false }`                                               | `src/pages/crm/EmployerCRMDashboard.jsx:38`              |
| Application         | `{ employer_id: employerId }`                                                                 | `src/pages/crm/EmployerCRMDashboard.jsx:39`              |
| Interview           | `{ employer_id: employerId }`                                                                 | `src/pages/crm/EmployerCRMDashboard.jsx:40`              |
| Application         | `{ candidate_email: user?.email }`                                                            | `src/pages/dashboards/CandidateDashboard.jsx:14`         |
| SavedJob            | `{ user_email: user?.email }`                                                                 | `src/pages/dashboards/CandidateDashboard.jsx:20`         |
| Interview           | `{ candidate_email: user?.email }`                                                            | `src/pages/dashboards/CandidateDashboard.jsx:26`         |
| Job                 | `{ employer_id: user?.email }`                                                                | `src/pages/dashboards/HiringManagerDashboard.jsx:14`     |
| Application         | `{ organization_id: user?.organization_id, recruiter_id: user?.id, }`                         | `src/pages/dashboards/RecruiterDashboard.jsx:58`         |
| Interview           | `{ organization_id: user?.organization_id, recruiter_id: user?.id, status: 'scheduled', }`    | `src/pages/dashboards/RecruiterDashboard.jsx:69`         |
| Candidate           | `{ employer_id: user?.email }`                                                                | `src/pages/dashboards/RecruitmentDashboard.jsx:55`       |
| Application         | `{ employer_id: user?.email }`                                                                | `src/pages/dashboards/RecruitmentDashboard.jsx:61`       |
| Application         | `{ organization_id: user?.organization_id, team_manager_id: user?.id, }`                      | `src/pages/dashboards/TeamManagerDashboard.jsx:15`       |
| Interview           | `{ organization_id: user?.organization_id, team_manager_id: user?.id, status: 'scheduled', }` | `src/pages/dashboards/TeamManagerDashboard.jsx:26`       |
| Job                 | `query`                                                                                       | `src/pages/DynamicJobsPage.jsx:42`                       |
| Candidate           | `{ employer_id: user?.email }`                                                                | `src/pages/employer/Candidates.jsx:35`                   |
| Job                 | `{ employer_id: user?.email }`                                                                | `src/pages/employer/Dashboard.jsx:58`                    |
| Application         | `{ employer_id: user?.email }`                                                                | `src/pages/employer/Dashboard.jsx:68`                    |
| Job                 | `{ employer_id: user.email }`                                                                 | `src/pages/employer/EmployerAnalyticsPage.jsx:31`        |
| Application         | `{ employer_id: user.email }`                                                                 | `src/pages/employer/EmployerAnalyticsPage.jsx:32`        |
| Interview           | `{ employer_id: user.email }`                                                                 | `src/pages/employer/EmployerAnalyticsPage.jsx:33`        |
| Job                 | `{ employer_id: user.email }`                                                                 | `src/pages/employer/EmployerDashboard.jsx:34`            |
| Candidate           | `{ employer_id: user.email }`                                                                 | `src/pages/employer/EmployerDashboard.jsx:35`            |
| Interview           | `{ employer_id: user.email, status: 'scheduled' }`                                            | `src/pages/employer/EmployerDashboard.jsx:36`            |
| Application         | `{ employer_id: user.email }`                                                                 | `src/pages/employer/EmployerDashboard.jsx:37`            |
| Job                 | `{ is_closed: false }`                                                                        | `src/pages/employer/ImportSources.jsx:91`                |
| Job                 | `{ employer_id: user?.email }`                                                                | `src/pages/employer/Jobs.jsx:24`                         |
| ApplicationPipeline | `{ employer_id: user.email }`                                                                 | `src/pages/employer/KanbanDashboard.jsx:15`              |
| Application         | `{ employer_id: user.email }`                                                                 | `src/pages/employer/KanbanDashboard.jsx:21`              |
| Staff               | `{ company_id: user.email }`                                                                  | `src/pages/employer/Settings.jsx:33`                     |
| CandidateProfile    | `{ user_email: user.email }`                                                                  | `src/pages/JobDetail.jsx:86`                             |
| Job                 | `{ is_closed: false }`                                                                        | `src/pages/Jobs.jsx:256`                                 |
| Message             | `{ application_id: application.id }`                                                          | `src/pages/Messages.jsx:43`                              |
| Application         | `{ employer_id: user.email }`                                                                 | `src/pages/Messages.jsx:130`                             |
| Application         | `{ candidate_email: user.email }`                                                             | `src/pages/Messages.jsx:131`                             |
| Message             | `{ application_id: app.id, is_read: false }`                                                  | `src/pages/Messages.jsx:141`                             |
| Application         | `{ candidate_email: user.email }`                                                             | `src/pages/MyApplications.jsx:40`                        |
| Interview           | `{ candidate_email: user.email }`                                                             | `src/pages/MyApplications.jsx:46`                        |
| Notification        | `{ recipient_email: user.email }`                                                             | `src/pages/Notifications.jsx:18`                         |
| Candidate           | `{ organization_id: user.organization_id, recruiter_id: user.id }`                            | `src/pages/recruiter/RecruiterDashboard.jsx:45`          |
| Application         | `{ organization_id: user.organization_id, recruiter_id: user.id }`                            | `src/pages/recruiter/RecruiterDashboard.jsx:46`          |
| Interview           | `{ organization_id: user.organization_id, recruiter_id: user.id, status: 'scheduled' }`       | `src/pages/recruiter/RecruiterDashboard.jsx:47`          |
| CompensationPlan    | `{ organization_id: user.organization_id, recruiter_id: user.id }`                            | `src/pages/recruiter/RecruiterDashboard.jsx:48`          |
| Interview           | `{ organization_id: user.organization_id, recruiter_id: user.id }`                            | `src/pages/recruiter/RecruiterInterviewsPage.jsx:30`     |
| CommunicationLog    | `{ sender_email: user.email }`                                                                | `src/pages/recruiter/RecruiterMessagesPage.jsx:14`       |
| SavedJob            | `{ user_email: user.email }`                                                                  | `src/pages/SavedJobs.jsx:14`                             |

Expressions that are not inline object literals are resolved below from their current definitions; they remain dynamic contracts that must be migrated to typed service filters.

### Resolved fields for dynamic expressions

| Expression                   | Possible fields                                                               | Definition                               |
| ---------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| `getAgencyScopeFilter(user)` | `organization_id`, `team_manager_id`, `recruiter_id`                          | `src/domain/agency/access.js`            |
| `jobFilter`                  | `organization_id`, `is_closed`                                                | `src/pages/ai/AIMatchingPage.jsx`        |
| `query`                      | `domain_id`, `role_id`, `location`                                            | `src/pages/DynamicJobsPage.jsx`          |
| `filter`                     | `status`, `organization_id`, `team_manager_id`, `recruiter_id`, `employer_id` | `src/pages/crm/CandidateListCRMPage.jsx` |

## Legacy functions still called by the frontend

- `crawlCareerPage`
- `extractAndTranslateResume`
- `getLocationFromIP`
- `getRecommendedJobs`
- `importAlljobs`
- `importElbit`
- `importJobicy`
- `importNovolog`
- `importNvidia`
- `importShafir`
- `scoreApplication`
- `smartSearch`
- `updateCompanyProfile`

## Legacy functions with no frontend consumer

- `analyzeResume`
- `auditDuplicateDetection`
- `auditPoolMerges`
- `checkInternalPermission`
- `checkPermission`
- `checkSlaBreaches`
- `convertResumeToDocx`
- `convertResumeToDocxProper`
- `createApplicationTimeline`
- `createAuditLog`
- `createBulkCandidates`
- `createCandidateTimeline`
- `createCompanyNotification`
- `debugCVExtraction`
- `debugEmailHeaders`
- `debugGmailSearch`
- `deleteCandidate`
- `detectDuplicateAdvanced`
- `emailIntakeHandler`
- `emailPoolIntakeHandler`
- `enrichJobDescriptions`
- `extractResumeFieldConfidence`
- `generateJobCode`
- `generateSitemaps`
- `getDashboardStats`
- `getJobRecommendations`
- `handleImportError`
- `importCandidatesFromFile`
- `importQueueProcessor`
- `importResumeFiles`
- `importRetryQueue`
- `importWix`
- `loadTaxonomy`
- `logOwnershipValidation`
- `migrateAgencyOwnershipIds`
- `migrateUsersToOrg`
- `parseResumeBatch`
- `processCandidateImport`
- `resolveRoleFromAlias`
- `resumePreviewAndDownload`
- `runImportCycle`
- `sendCandidateToEmployer`
- `sendInterviewReminder`
- `sendJobAlerts`
- `separateFalseMerges`
- `setUserRole`
- `validateEntityOwnership`
- `validateImportBatch`
- `verifyHierarchyIsolation`
- `verifyPhaseA`
- `verifyPoolIntake`
