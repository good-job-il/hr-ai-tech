/**
 * Pipeline Notifications
 * Creates Notification records when application stage changes.
 * Determines recipients based on role and stage type.
 */
import { httpClient } from '@/api/client/httpClient';
import i18n from '@/i18n';

// Employer is relevant after the agency recommends the candidate.
const EMPLOYER_RELEVANT_STAGES = [
  'recommended',
  'employer_interview',
  'offer',
  'hired',
  'probation',
  'completed',
  'rejected',
];

// Admin gets notified only on exceptional events
const ADMIN_ALERT_STAGES = ['hired', 'rejected'];

function t(key, options) {
  return i18n.t(key, options);
}

function stageLabel(id) {
  return t(`pipeline.stages.${id}`, { defaultValue: id });
}

function buildTitle(candidateName, newStage) {
  if (newStage === 'hired') {
    return t('pipeline.notifications.stageChange.hiredTitle', { name: candidateName });
  }
  if (newStage === 'rejected') {
    return t('pipeline.notifications.stageChange.rejectedTitle', { name: candidateName });
  }
  return t('pipeline.notifications.stageChange.movedTitle', {
    name: candidateName,
    stage: stageLabel(newStage),
  });
}

function buildContent(candidateName, oldStage, newStage, changedBy) {
  return t('pipeline.notifications.stageChange.content', {
    name: candidateName,
    from: stageLabel(oldStage),
    to: stageLabel(newStage),
    changedBy: changedBy || t('pipeline.data.defaultRecruiter'),
  });
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

  const candidateName = application.candidate_name || t('pipeline.notifications.defaultCandidate');
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

  const recipients = await resolveRecipientEmails(collectRecipients({ application, newStage, user }));

  const seen = new Set();
  const creates = [];

  for (const { email, role_target } of recipients) {
    if (!email || seen.has(email)) continue;
    seen.add(email);

    creates.push(
      httpClient.post('/notifications', {
        organization_id: application.organization_id || user?.organization_id || null,
        recipient_email: email,
        type: mapNotificationType(newStage),
        title,
        content,
        metadata: { ...metadata, role_target },
        is_read: false,
      })
    );
  }

  await Promise.allSettled(creates);
}

/**
 * SLA exceeded notification
 */
export async function createSlaNotification({ application, stageLabel: stage, hoursInStage, user }) {
  const candidateName = application.candidate_name || t('pipeline.notifications.defaultCandidate');
  const recipients = await resolveRecipientEmails(collectRecipients({ application, newStage: application.status, user }));

  const seen = new Set();
  const creates = [];

  for (const { email, role_target } of recipients) {
    if (!email || seen.has(email)) continue;
    seen.add(email);

    creates.push(
      httpClient.post('/notifications', {
        organization_id: application.organization_id || user?.organization_id || null,
        recipient_email: email,
        type: 'job_closed', // repurpose as system alert
        title: t('pipeline.notifications.sla.title', {
          name: candidateName,
          hours: hoursInStage,
          stage,
        }),
        content: t('pipeline.notifications.sla.content', {
          name: candidateName,
          hours: hoursInStage,
          stage,
        }),
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

  const recruiterEmail = application.assigned_to || application.recruiter_id;
  if (recruiterEmail) {
    recipients.push({
      ...(String(recruiterEmail).includes('@') ? { email: recruiterEmail } : { userId: recruiterEmail }),
      role_target: 'recruiter',
    });
  }

  if (user?.role === 'recruitment_manager') {
    recipients.push({ email: user.email, role_target: 'recruitment_manager' });
  }

  if (EMPLOYER_RELEVANT_STAGES.includes(newStage)) {
    const employerEmail = application.employer_id;
    if (employerEmail) {
      recipients.push({ email: employerEmail, role_target: 'employer' });
    }
  }

  if (ADMIN_ALERT_STAGES.includes(newStage)) {
    recipients.push({ email: 'admin', role_target: 'admin' });
  }

  if (user?.email && !recipients.find(r => r.email === user.email)) {
    recipients.push({ email: user.email, role_target: user.role || 'recruiter' });
  }

  return recipients;
}

async function resolveRecipientEmails(recipients) {
  return Promise.all(recipients.map(async recipient => {
    if (recipient.email || !recipient.userId) return recipient;
    try {
      const record = await httpClient.get(`/users/${encodeURIComponent(recipient.userId)}`, { cache: false });
      return { ...recipient, email: record?.email || null };
    } catch {
      return { ...recipient, email: null };
    }
  }));
}

function mapNotificationType(stage) {
  if (stage === 'hired') return 'job_match';
  if (['phone_interview', 'employer_interview'].includes(stage)) return 'interview_scheduled';
  return 'new_application';
}
