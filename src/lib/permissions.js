/**
 * Permission Rules
 * ─────────────────────────────────────────────────────────────
 * employer          = לקוח חיצוני (מי עדן, נובולוג וכו')
 * recruiter         = מגייס פנימי בחברת ההשמה
 * team_manager      = מנהל צוות פנימי בחברת ההשמה
 * recruitment_manager = מנהל גיוס פנימי בחברת ההשמה
 * admin             = גישה מלאה לכל
 *
 * Ownership fields (per entity):
 *   Candidate:    recruiter_id, team_manager_id, recruitment_manager_id, agency_company_id, employer_company_id
 *   Application:  recruiter_id, team_manager_id, recruitment_manager_id, agency_company_id, employer_company_id
 *   Job:          recruiter_id, employer_company_id, agency_company_id
 *   Compensation: agency_company_id, recruiter_id, team_manager_id, recruitment_manager_id
 * ─────────────────────────────────────────────────────────────
 */

export const PERMISSIONS = {

  // ─── Employer (לקוח חיצוני) ───────────────────────────────
  employer: {
    Job:                  { read: 'own', create: false, update: false, delete: false },
    Application:          { read: 'own', create: false, update: false,  delete: false },
    Candidate:            { read: 'own', create: false, update: false,  delete: false },
    CandidateNote:        { read: 'own', create: true,  update: 'own',  delete: 'own' },
    Interview:            { read: 'own', create: false, update: 'own',  delete: false },
    ApplicationPipeline:  { read: 'own', create: false, update: false,  delete: false },
    Message:              { read: 'own', create: true,  update: false,  delete: false },
    CandidateProfile:     { read: true,  create: false, update: false,  delete: false },
    CompanyReview:        { read: true,  create: false, update: false,  delete: false },
    // Employer cannot access:
    CompensationPlan:     { read: false, create: false, update: false,  delete: false },
    CandidateImportBatch: { read: false, create: false, update: false,  delete: false },
    Position:             { read: false, create: false, update: false,  delete: false },
  },

  // ─── Recruiter (מגייס פנימי) ──────────────────────────────
  recruiter: {
    Job:                  { read: 'own', create: true,  update: 'own',  delete: false },
    Application:          { read: 'own', create: true,  update: 'own',  delete: false },
    Candidate:            { read: 'own', create: true,  update: 'own',  delete: false },
    CandidateNote:        { read: 'own', create: true,  update: 'own',  delete: 'own' },
    CandidateImportBatch: { read: 'own', create: true,  update: 'own',  delete: false },
    Interview:            { read: 'own', create: true,  update: 'own',  delete: false },
    ApplicationPipeline:  { read: 'own', create: true,  update: 'own',  delete: false },
    Message:              { read: 'own', create: true,  update: false,  delete: false },
    CandidateProfile:     { read: true,  create: false, update: false,  delete: false },
    CompensationPlan:     { read: 'own', create: false, update: false,  delete: false },
    Position:             { read: true,  create: false, update: false,  delete: false },
    CompanyReview:        { read: true,  create: false, update: false,  delete: false },
  },

  // ─── Team Manager (מנהל צוות פנימי) ──────────────────────
  team_manager: {
    Job:                  { read: 'team', create: true,  update: 'team', delete: false },
    Application:          { read: 'team', create: false, update: 'team', delete: false },
    Candidate:            { read: 'team', create: true,  update: 'team', delete: false },
    CandidateNote:        { read: 'team', create: true,  update: 'own',  delete: 'own' },
    CandidateImportBatch: { read: 'team', create: true,  update: 'team', delete: false },
    Interview:            { read: 'team', create: true,  update: 'team', delete: false },
    ApplicationPipeline:  { read: 'team', create: true,  update: 'team', delete: false },
    Message:              { read: 'own',  create: true,  update: false,  delete: false },
    CandidateProfile:     { read: true,   create: false, update: false,  delete: false },
    CompensationPlan:     { read: 'team', create: false, update: 'team', delete: false },
    Position:             { read: true,   create: false, update: false,  delete: false },
    CompanyReview:        { read: true,   create: false, update: false,  delete: false },
  },

  // ─── Recruitment Manager (מנהל גיוס פנימי) ───────────────
  recruitment_manager: {
    Job:                  { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    Application:          { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    Candidate:            { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    CandidateNote:        { read: 'agency', create: true,  update: 'own',    delete: 'own' },
    CandidateImportBatch: { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    Interview:            { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    ApplicationPipeline:  { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    Message:              { read: 'own',    create: true,  update: false,    delete: false },
    CandidateProfile:     { read: true,     create: false, update: false,    delete: false },
    CompensationPlan:     { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    Position:             { read: 'agency', create: true,  update: 'agency', delete: 'agency' },
    CompanyReview:        { read: true,     create: false, update: false,    delete: false },
  },

  // ─── Admin (גישה מלאה) ────────────────────────────────────
  admin: {
    Job:                  { read: true, create: true, update: true, delete: true },
    SavedJob:             { read: true, create: true, update: true, delete: true },
    Application:          { read: true, create: true, update: true, delete: true },
    CandidateProfile:     { read: true, create: true, update: true, delete: true },
    Candidate:            { read: true, create: true, update: true, delete: true },
    CandidateNote:        { read: true, create: true, update: true, delete: true },
    CandidateImportBatch: { read: true, create: true, update: true, delete: true },
    Message:              { read: true, create: true, update: true, delete: true },
    Interview:            { read: true, create: true, update: true, delete: true },
    JobAlert:             { read: true, create: true, update: true, delete: true },
    ApplicationPipeline:  { read: true, create: true, update: true, delete: true },
    Position:             { read: true, create: true, update: true, delete: true },
    Staff:                { read: true, create: true, update: true, delete: true },
    UserPositionAccess:   { read: true, create: true, update: true, delete: true },
    Company:              { read: true, create: true, update: true, delete: true },
    CompanyReview:        { read: true, create: true, update: true, delete: true },
    CompensationPlan:     { read: true, create: true, update: true, delete: true },
    ImportSource:         { read: true, create: true, update: true, delete: true },
    User:                 { read: true, create: false, update: true, delete: false },
  },

  // ─── Candidate (מחפש עבודה) ───────────────────────────────
  candidate: {
    Job:            { read: true,  create: false, update: false, delete: false },
    SavedJob:       { read: true,  create: true,  update: false, delete: true },
    Application:    { read: 'own', create: true,  update: 'own', delete: 'own' },
    CandidateProfile: { read: 'own', create: true, update: 'own', delete: false },
    Message:        { read: 'own', create: true,  update: false, delete: false },
    Interview:      { read: 'own', create: false, update: false, delete: false },
    JobAlert:       { read: 'own', create: true,  update: 'own', delete: true },
    CompanyReview:  { read: true,  create: true,  update: 'own', delete: 'own' },
  },
};

/**
 * Check if user can perform an action on an entity
 */
export const canPerformAction = (userRole, entityName, action) => {
  const userPermissions = PERMISSIONS[userRole];
  if (!userPermissions) return false;
  const entityPermissions = userPermissions[entityName];
  if (!entityPermissions) return false;
  const permission = entityPermissions[action];
  return permission === true || permission === 'own' || permission === 'team' || permission === 'agency';
};