/**
 * AI-Assisted Matching Engine
 * Rule-based scoring between Candidate ↔ Job.
 * Produces a 0–100 score + structured explanation.
 * Ready for LLM upgrade (swap scoreWithLLM in the future).
 */

// ─── Weights (must sum to 100) ───────────────────────────────────────────────
const WEIGHTS = {
  domain:        18,   // same domain/category
  role:          18,   // role / job-title similarity
  skills:        20,   // overlapping skills
  experience:    15,   // years of experience vs requirement
  location:       8,   // location match
  salary:         8,   // salary range overlap
  jobType:        5,   // full/part/remote
  availability:   4,   // immediate / notice period
  bonusReq:       4,   // bonus requirements
};

// ─── Main entry ──────────────────────────────────────────────────────────────

/**
 * Score a Candidate against a Job.
 * @param {object} candidate  - Candidate entity
 * @param {object} job        - Job entity
 * @returns {{ score: number, breakdown: object, explanation: object }}
 */
export function scoreMatch(candidate, job) {
  const breakdown = {};

  breakdown.domain    = scoreDomain(candidate, job);
  breakdown.role      = scoreRole(candidate, job);
  breakdown.skills    = scoreSkills(candidate, job);
  breakdown.experience = scoreExperience(candidate, job);
  breakdown.location  = scoreLocation(candidate, job);
  breakdown.salary    = scoreSalary(candidate, job);
  breakdown.jobType   = scoreJobType(candidate, job);
  breakdown.availability = 100; // default — extend when availability field exists
  breakdown.bonusReq  = 50;     // neutral by default

  // Weighted sum
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    total += (breakdown[key] / 100) * weight;
  }
  const score = Math.round(Math.min(100, Math.max(0, total)));

  const explanation = buildExplanation(candidate, job, breakdown, score);

  return { score, breakdown, explanation };
}

// ─── Per-dimension scorers ────────────────────────────────────────────────────

function scoreDomain(candidate, job) {
  if (!candidate.domain_id || !job.domain_id) return 50;
  return candidate.domain_id === job.domain_id ? 100 : 0;
}

function scoreRole(candidate, job) {
  const cRole = normalize(`${candidate.role_name || ''} ${candidate.specialization_name || ''}`);
  const jTitle = normalize(job.title || '');
  if (!cRole || !jTitle) return 40;
  if (cRole === jTitle) return 100;
  if (jTitle.includes(cRole) || cRole.includes(jTitle)) return 85;
  const cWords = new Set(cRole.split(' '));
  const jWords = jTitle.split(' ');
  const overlap = jWords.filter(w => cWords.has(w)).length;
  return Math.min(80, overlap * 25);
}

function scoreSkills(candidate, job) {
  const cSkills = normalizeArr(candidate.skills);
  const jDesc = normalize(job.description || job.title || '');
  if (!cSkills.length) return 30;
  const matched = cSkills.filter(s => jDesc.includes(s)).length;
  return Math.round((matched / Math.max(cSkills.length, 1)) * 100);
}

function scoreExperience(candidate, job) {
  const candidateYears = candidate.experience_years || 0;
  const required = job.required_experience || extractExpFromDesc(job.description) || 3;
  if (candidateYears >= required) {
    // Over-qualified penalty is small
    const over = candidateYears - required;
    return Math.max(70, 100 - over * 2);
  }
  const gap = required - candidateYears;
  if (gap <= 1) return 75;
  if (gap <= 2) return 50;
  if (gap <= 3) return 25;
  return 0;
}

function scoreLocation(candidate, job) {
  const cLoc = normalize(candidate.location || '');
  const jLoc = normalize(job.location || '');
  if (!cLoc || !jLoc) return 60;
  if (cLoc === jLoc) return 100;
  if (jLoc.includes('remote') || jLoc.includes('מרחוק') || job.type === 'remote') return 90;
  if (cLoc.includes(jLoc) || jLoc.includes(cLoc)) return 80;
  return 20;
}

function scoreSalary(candidate, job) {
  const cMin = candidate.desired_salary_min || 0;
  const cMax = candidate.desired_salary_max || 99999;
  const jMin = job.salary_min || 0;
  const jMax = job.salary_max || 99999;
  if (cMax < jMin || cMin > jMax) return 10; // no overlap
  const overlapMin = Math.max(cMin, jMin);
  const overlapMax = Math.min(cMax, jMax);
  const overlapRange = overlapMax - overlapMin;
  const candidateRange = cMax - cMin || 1;
  return Math.min(100, Math.round((overlapRange / candidateRange) * 100));
}

function scoreJobType(candidate, job) {
  const jobType = job.type;
  if (!jobType) return 70;
  if (jobType === 'remote') return 90;
  return 80;
}

// ─── Explanation builder ──────────────────────────────────────────────────────

function buildExplanation(candidate, job, breakdown, score) {
  const strengths = [];
  const gaps = [];
  const risks = [];
  const recommendations = [];
  const screeningQuestions = [];

  // Strengths
  if (breakdown.domain >= 80) strengths.push(`תחום מקצועי תואם (${candidate.domain_name || 'תחום זהה'})`);
  if (breakdown.role >= 75) strengths.push(`תפקיד קודם רלוונטי: ${candidate.role_name || candidate.job_title || ''}`);
  if (breakdown.skills >= 60) strengths.push(`כישורים תואמים: ${(candidate.skills || []).slice(0, 3).join(', ')}`);
  if (breakdown.experience >= 75) strengths.push(`ניסיון מספק: ${candidate.experience_years} שנים`);
  if (breakdown.location >= 80) strengths.push(`מיקום תואם`);
  if (breakdown.salary >= 70) strengths.push(`ציפיות שכר בטווח`);

  // Gaps
  if (breakdown.domain < 50) gaps.push('תחום מקצועי שונה — נדרש בדיקה');
  if (breakdown.role < 50) gaps.push('תפקיד קודם לא זהה לדרישה');
  if (breakdown.skills < 40) gaps.push('פער בכישורים נדרשים');
  if (breakdown.experience < 50) {
    const req = job.required_experience || extractExpFromDesc(job.description) || 3;
    const gap = req - (candidate.experience_years || 0);
    if (gap > 0) gaps.push(`חסר ${gap} שנות ניסיון (נדרש ${req}, יש ${candidate.experience_years || 0})`);
  }
  if (breakdown.salary < 40) gaps.push('ציפיות שכר מחוץ לטווח המוצע');
  if (breakdown.location < 40) gaps.push('מיקום לא תואם — בדוק נכונות לנסוע');

  // Risks
  if (breakdown.experience > 90 && (candidate.experience_years || 0) > (job.required_experience || 3) + 4) {
    risks.push('המועמד בעל ניסיון רב מאוד — בדוק ציפיות תפקיד');
  }
  if (breakdown.salary < 30) risks.push('פערי שכר גבוהים — סיכוי גבוה לנשור');
  if (score < 50) risks.push('ציון התאמה נמוך — מומלץ לשקול מועמדים אחרים');

  // Recommendations
  if (breakdown.skills < 60) recommendations.push('שלח שאלון מקדים לבדיקת כישורים טכניים');
  if (breakdown.salary < 60) recommendations.push('בדוק גמישות שכר עם המועמד לפני קידום');
  if (breakdown.location < 60) recommendations.push('הבהר תנאי עבודה מרחוק/היברידי');
  if (score >= 80) recommendations.push('מועמד מומלץ — קדם לראיון טלפוני');
  else if (score >= 60) recommendations.push('כדאי לסנן בשיחה קצרה לפני קידום');

  // Screening questions
  if (breakdown.skills < 70) {
    const skills = (candidate.skills || []).slice(0, 2);
    if (skills.length > 0) screeningQuestions.push(`ספר על ניסיונך עם ${skills.join(' ו-')}`);
  }
  if (breakdown.experience < 75) screeningQuestions.push('מה הפרויקט הגדול ביותר שניהלת בתחום?');
  if (breakdown.salary < 70) screeningQuestions.push('מהן ציפיות השכר שלך לתפקיד זה?');
  screeningQuestions.push('מה מניע אותך לעבור תפקיד כרגע?');

  const label = score >= 85 ? 'התאמה מצוינת' :
                score >= 70 ? 'התאמה טובה' :
                score >= 50 ? 'התאמה חלקית' : 'התאמה נמוכה';

  return {
    label,
    score,
    strengths: strengths.length ? strengths : ['נדרשת בדיקה נוספת'],
    gaps,
    risks,
    recommendations,
    screeningQuestions,
    requiredMet: breakdown.experience >= 50 && breakdown.domain >= 50,
    missingRequired: gaps.filter(g => g.includes('ניסיון') || g.includes('תחום')),
    nextAction: score >= 80 ? 'העבר לראיון טלפוני' :
                score >= 60 ? 'סנן בשיחה קצרה' :
                score >= 40 ? 'שקול מול מועמדים אחרים' : 'לא מומלץ לקידום',
  };
}

// ─── Batch helpers ────────────────────────────────────────────────────────────

/**
 * Given one candidate, score against many jobs. Returns sorted array.
 */
export function rankJobsForCandidate(candidate, jobs) {
  return jobs
    .map(job => ({ job, ...scoreMatch(candidate, job) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Given one job, score against many candidates. Returns sorted array.
 */
export function rankCandidatesForJob(job, candidates) {
  return candidates
    .map(candidate => ({ candidate, ...scoreMatch(candidate, job) }))
    .sort((a, b) => b.score - a.score);
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

function normalizeArr(arr) {
  return (arr || []).map(s => normalize(String(s))).filter(Boolean);
}

function extractExpFromDesc(desc) {
  if (!desc) return null;
  const match = desc.match(/(\d+)\s*(?:\+|plus)?\s*(?:שנות?|years?)/i);
  return match ? parseInt(match[1], 10) : null;
}