import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EMPLOYER_ID = 'import@headhunter.co.il';

const CATEGORY_MAP = {
  'dev': 'פיתוח תוכנה',
  'engineering': 'הנדסה',
  'design-multimedia': 'עיצוב',
  'web-app-design': 'עיצוב',
  'marketing': 'שיווק',
  'smm': 'שיווק',
  'seo': 'שיווק',
  'seller': 'מכירות',
  'management': 'ניהול',
  'hr': 'HR',
  'accounting-finance': 'כספים',
  'data-science': 'נתונים ו-AI',
  'supporting': 'תמיכה',
  'technical-support': 'תמיכה',
  'admin': 'אדמין',
  'admin-support': 'אדמין',
  'business': 'עסקים',
  'copywriting': 'תוכן וכתיבה',
  'education': 'חינוך',
  'healthcare': 'רפואה',
  'legal': 'משפטי',
};

const TYPE_MAP = {
  'full-time': 'full',
  'part-time': 'part',
  'contract': 'daily',
  'freelance': 'daily',
};

function titleToColor(title) {
  const colors = ['#6d28d9','#0891b2','#0d9488','#d97706','#dc2626','#7c3aed','#059669','#db2777'];
  let hash = 0;
  for (const c of (title || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

async function resolveRoleAndDomain(base44, jobTitle) {
  try {
    const roles = await base44.asServiceRole.entities.Role.list('-role_id', 500);
    const aliases = await base44.asServiceRole.entities.RoleAlias.list('-created_date', 500);
    
    const titleLower = jobTitle.toLowerCase().trim();
    
    const matchingAlias = aliases.find(a => a.alias.toLowerCase() === titleLower);
    if (matchingAlias) {
      const role = roles.find(r => r.name === matchingAlias.canonical_role);
      if (role && role.domain_id) {
        return { role_id: role.role_id, domain_id: role.domain_id };
      }
    }
    
    const exactRole = roles.find(r => r.name.toLowerCase() === titleLower);
    if (exactRole && exactRole.domain_id) {
      return { role_id: exactRole.role_id, domain_id: exactRole.domain_id };
    }
    
    const partialRole = roles.find(r => r.name.toLowerCase().includes(titleLower.split(/\s+/)[0]));
    if (partialRole && partialRole.domain_id) {
      return { role_id: partialRole.role_id, domain_id: partialRole.domain_id };
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const sourceId = body.sourceId;

    // Fetch from Jobicy API - Israel region, up to 100 jobs
    const url = 'https://jobicy.com/api/v2/remote-jobs?count=100&geo=israel';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HeadHunterBot/1.0)' }
    });

    if (!res.ok) throw new Error(`Jobicy API error: ${res.status}`);
    const data = await res.json();
    const items = data.jobs || [];

    // Get existing jobs from this source
    const existing = await base44.asServiceRole.entities.Job.filter({ employer_id: EMPLOYER_ID });
    const existingMap = {};
    for (const j of existing) {
      if (j.external_id) existingMap[j.external_id] = j;
    }

    const logs = [];
    let added = 0, updated = 0, closed = 0;
    const seenIds = new Set();

    for (const item of items) {
      const externalId = `jobicy_${item.id}`;
      seenIds.add(externalId);

      const category = CATEGORY_MAP[item.jobIndustry?.[0]] || item.jobIndustry?.[0] || 'כללי';
      const jobType = TYPE_MAP[item.jobType] || 'remote';
      const initials = (item.companyName || 'חברה').slice(0, 2);
      const color = titleToColor(item.jobTitle);

      // Strip HTML from description
      const description = (item.jobDescription || item.jobExcerpt || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const roleAndDomain = await resolveRoleAndDomain(base44, item.jobTitle || 'משרה');

      const jobData = {
        title: item.jobTitle || 'משרה',
        company: 'חברה אנונימית',
        company_initials: initials,
        company_color: color,
        location: 'ישראל',
        category,
        type: jobType,
        description,
        employer_id: EMPLOYER_ID,
        external_id: externalId,
        is_anonymous: true,
        show_company_name: false,
        show_company_info: false,
        show_contact_details: false,
        is_closed: false,
        salary_min: item.salaryMin || null,
        salary_max: item.salaryMax || null,
        domain_id: roleAndDomain?.domain_id || null,
        role_id: roleAndDomain?.role_id || null,
      };

      if (existingMap[externalId]) {
        await base44.asServiceRole.entities.Job.update(existingMap[externalId].id, jobData);
        updated++;
      } else {
        await base44.asServiceRole.entities.Job.create(jobData);
        added++;
        logs.push(`נוסף: ${item.jobTitle}`);
      }
    }

    // Close jobs no longer in feed
    for (const [extId, job] of Object.entries(existingMap)) {
      if (!seenIds.has(extId) && !job.is_closed) {
        await base44.asServiceRole.entities.Job.update(job.id, { is_closed: true });
        closed++;
      }
    }

    // Update source status
    if (sourceId) {
      await base44.asServiceRole.entities.ImportSource.update(sourceId, {
        last_sync: new Date().toISOString(),
        last_sync_status: 'success',
        jobs_added: added,
        jobs_updated: updated,
        jobs_closed: closed,
        logs: logs.slice(0, 20).join('\n'),
      });
    }

    return Response.json({ success: true, added, updated, closed, total: items.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});