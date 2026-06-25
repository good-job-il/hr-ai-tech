/**
 * Pipeline Notifications
 * Creates Notification records when application stage changes.
 * Determines recipients based on role and stage type.
 */
import { base44 } from '@/api/base44Client';

const STAGE_LABELS = {
  new: 'חדש',
  screening: 'סינון ראשוני',
  phone_interview: 'ראיון טלפוני',
  professional_interview: 'ראיון מקצועי',
  client_stage: 'שלב לקוח',
  hired: 'התקבל',
  rejected: 'נדחה',
};

// Employer is relevant only from client_stage onward
const EMPLOYER_RELEVANT_STAGES = ['client_stage', 'hired', 'rejected'];

// Admin gets notified only on exceptional events
const ADMIN_ALERT_STAGES = ['hired', 'rejected'];

function buildTitle(candidateName, newStage) {
  if (newStage === 'hired') return `🎉 ${candidateName} התקבל לתפקיד!`;
  if (newStage === 'rejected') return `${candidateName} נדחה מהתהליך`;
  return `${candidateName} עבר לשלב: ${STAGE_LABELS[newStage] || newStage}`;
}

function buildContent(candidateName, oldStage, newStage, changedBy) {
  const oldLabel = STAGE_LABELS[oldStage] || oldStage;
  const newLabel = STAGE_LABELS[newStage] || newStage;
  return `${candidateName} הועבר מ"${oldLabel}" ל"${newLabel}" על ידי ${changedBy || 'מגייס'}.`;
}

/**
 * Creates notifications for a stage change.
 * @param {object} params
 */
export async function createStageChangeNotifications({
  application,
  oldStage,
  newStage,
  changedBy,
  user,
}) {
  if (!application || !newStage || oldStage === newStage) return;

  const candidateName = application.candidate_name || 'מועמד';
  const title = buildTitle(candidateName, newStage);
  const content = buildContent(candidateName, oldStage, newStage, changedBy);

  const metadata = {
    application_id: application.id,
    candidate_name: candidateName,
    candidate_email: application.candidate_email || null,
    old_stage: oldStage,
    new_stage: newStage,
    changed_by: changedBy || null,
    timestamp: new Date().toISOString(),
    job_title: application.job_title || null,
    employer_id: application.employer_id || null,
    recruiter_id: application.assigned_to || application.recruiter_id || null,
    company: application.company || null,
  };

  const recipients = collectRecipients({ application, newStage, user });

  // Create one notification per unique recipient
  const seen = new Set();
  const creates = [];

  for (const { email, role_target } of recipients) {
    if (!email || seen.has(email)) continue;
    seen.add(email);

    creates.push(
      base44.entities.Notification.create({
        recipient_email: email,
        type: mapNotificationType(newStage),
        title,
        content,
        metadata: { ...metadata, role_target },
        is_read: false,
      })
    );
  }

  // Fire all creates in parallel, silently ignore errors
  await Promise.allSettled(creates);
}

/**
 * SLA exceeded notification
 */
export async function createSlaNotification({ application, stageLabel, hoursInStage, user }) {
  const candidateName = application.candidate_name || 'מועמד';
  const recipients = collectRecipients({ application, newStage: application.status, user });

  const seen = new Set();
  const creates = [];

  for (const { email, role_target } of recipients) {
    if (!email || seen.has(email)) continue;
    seen.add(email);

    creates.push(
      base44.entities.Notification.create({
        recipient_email: email,
        type: 'job_closed', // repurpose as system alert
        title: `⏰ ${candidateName} תקוע ${hoursInStage} שעות בשלב "${stageLabel}"`,
        content: `המועמד ${candidateName} נמצא בשלב "${stageLabel}" כבר ${hoursInStage} שעות ועלול לפספס את חלון ההזדמנויות.`,
        metadata: {
          application_id: application.id,
          candidate_name: candidateName,
          stage: application.status,
          hours_in_stage: hoursInStage,
          timestamp: new Date().toISOString(),
          role_target,
          type: 'sla_exceeded',
        },
        is_read: false,
      })
    );
  }

  await Promise.allSettled(creates);
}

// ---------- helpers ----------

function collectRecipients({ application, newStage, user }) {
  const recipients = [];

  // 1. Recruiter assigned to this application
  const recruiterEmail = application.assigned_to || application.recruiter_id;
  if (recruiterEmail) {
    recipients.push({ email: recruiterEmail, role_target: 'recruiter' });
  }

  // 2. Recruitment manager — always notified (use current user's manager or app-level)
  //    We send to the current user if they are a recruitment_manager,
  //    otherwise we also add a generic recruitment_manager placeholder.
  if (user?.role === 'recruitment_manager') {
    recipients.push({ email: user.email, role_target: 'recruitment_manager' });
  }

  // 3. Employer — only for relevant stages
  if (EMPLOYER_RELEVANT_STAGES.includes(newStage)) {
    const employerEmail = application.employer_id;
    if (employerEmail) {
      recipients.push({ email: employerEmail, role_target: 'employer' });
    }
  }

  // 4. Admin — only for exceptional stages
  if (ADMIN_ALERT_STAGES.includes(newStage)) {
    // We record this; the actual admin email must exist in the User entity
    // We'll create a notification with a placeholder that the admin can filter
    recipients.push({ email: 'admin', role_target: 'admin' });
  }

  // 5. Always notify the person who made the change (so they have a receipt)
  if (user?.email && !recipients.find(r => r.email === user.email)) {
    recipients.push({ email: user.email, role_target: user.role || 'recruiter' });
  }

  return recipients;
}

function mapNotificationType(stage) {
  if (stage === 'hired') return 'job_match';
  if (['phone_interview', 'professional_interview'].includes(stage)) return 'interview_scheduled';
  return 'new_application';
}