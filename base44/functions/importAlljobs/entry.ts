import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COLORS = ['#3da8c8','#e74c3c','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e67e22','#3498db'];
const ANON_COMPANY = 'חברה מובילה';
const EMPLOYER_ID = 'alljobs_import';

function getColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
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

async function enrichAndAnonymize(base44, job) {
  const missingFields = [];
  if (!job.salary_min && !job.salary_max) missingFields.push('salary_min, salary_max');
  if (!job.description || job.description.length < 50) missingFields.push('description');
  if (!job.category) missingFields.push('category');
  if (!job.location) missingFields.push('location');

  if (missingFields.length === 0) return job;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `אתה מומחה בשוק העבודה הישראלי.
בהתבסס על פרטי המשרה הבאה, השלם את השדות החסרים עם מידע הגיוני ואמין בהתאם לנתוני שוק 2024-2025.
אל תמציא מידע מוגזם. השתמש בטווחים ממוצעים לתפקיד דומה.

משרה:
- כותרת: ${job.title}
- מיקום: ${job.location || 'לא צוין'}
- קטגוריה: ${job.category || 'לא צוין'}
- סוג: ${job.type}
- תיאור קיים: ${job.description || 'אין'}

השדות שיש להשלים: ${missingFields.join(', ')}

כללים:
- salary_min ו-salary_max: שכר ברוטו חודשי בשקלים (מספר בלבד). אם daily - טווח יומי (200-600).
- description: 2-3 משפטים קצרים ומציאותיים בעברית. ללא אזכור שם חברה.
- category: אחד מ: פיתוח תוכנה, עיצוב, שיווק, מכירות, כספים, HR, הנדסה, רפואה, חינוך, לוגיסטיקה, מסעדנות, שירות לקוחות, בנייה, אחר
- location: עיר בישראל בעברית`,
    response_json_schema: {
      type: "object",
      properties: {
        salary_min: { type: "number" },
        salary_max: { type: "number" },
        description: { type: "string" },
        category: { type: "string" },
        location: { type: "string" }
      }
    }
  });

  if (result) {
    if (!job.salary_min && result.salary_min) job.salary_min = result.salary_min;
    if (!job.salary_max && result.salary_max) job.salary_max = result.salary_max;
    if ((!job.description || job.description.length < 50) && result.description) job.description = result.description;
    if (!job.category && result.category) job.category = result.category;
    if (!job.location && result.location) job.location = result.location;
  }

  return job;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    let source;
    if (body.source_id) {
      source = await base44.asServiceRole.entities.ImportSource.get(body.source_id);
    }

    const pages = [
      'https://www.alljobs.co.il/SearchResultsGuest.aspx?page=1&position=&type=&city=&region=1',
      'https://www.alljobs.co.il/SearchResultsGuest.aspx?page=2&position=&type=&city=&region=1',
      'https://www.alljobs.co.il/SearchResultsGuest.aspx?page=3&position=&type=&city=&region=1',
      'https://www.alljobs.co.il/SearchResultsGuest.aspx?page=1&position=&type=&city=713&region=',
      'https://www.alljobs.co.il/SearchResultsGuest.aspx?page=2&position=&type=&city=713&region=',
    ];

    let allJobs = [];

    for (const url of pages) {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'he-IL,he;q=0.9',
          'Referer': 'https://www.alljobs.co.il/',
        }
      });
      const html = await resp.text();

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extract all job listings from this HTML page. Return a JSON array.
For each job extract:
- title (string): job title in Hebrew
- location (string): city/location in Hebrew
- category (string): job category in Hebrew
- type (string): one of "full","part","remote","daily"
- description (string): short description if available
- external_id (string): unique job ID found in URL or data attributes

DO NOT include company name, contact details, phone, email, or logo.

HTML (first 80000 chars):
${html.slice(0, 80000)}

Return ONLY valid JSON array. Example: [{"title":"מפתח","location":"חיפה","category":"תוכנה","type":"full","description":"","external_id":"12345"}]`,
        response_json_schema: {
          type: "object",
          properties: {
            jobs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  location: { type: "string" },
                  category: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  external_id: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.jobs?.length) {
        allJobs = allJobs.concat(result.jobs);
      }
    }

    // Deduplicate by external_id or title
    const seen = new Set();
    const unique = allJobs.filter(j => {
      if (!j.title) return false;
      const key = j.external_id || j.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Fetch all existing jobs from this source
    const existing = await base44.asServiceRole.entities.Job.filter({ employer_id: EMPLOYER_ID }, '-created_date', 500);
    const existingByKey = {};
    for (const j of existing) {
      const key = j.external_id || j.title;
      if (key) existingByKey[key] = j;
    }

    // Identify which scraped jobs are new vs existing
    const currentKeys = new Set(unique.map(j => j.external_id || j.title));
    const validTypes = ['full', 'part', 'daily', 'remote'];
    let created = 0;
    let updated = 0;
    let closed = 0;

    // Close jobs no longer in the feed
    for (const existingJob of existing) {
      const key = existingJob.external_id || existingJob.title;
      if (key && !currentKeys.has(key) && !existingJob.is_closed) {
        await base44.asServiceRole.entities.Job.update(existingJob.id, { is_closed: true });
        closed++;
      }
    }

    // Create or update jobs
    for (const job of unique) {
      const key = job.external_id || job.title;
      const existingJob = existingByKey[key];

      const jobData = await enrichAndAnonymize(base44, {
        title: job.title,
        location: job.location || '',
        category: job.category || '',
        type: validTypes.includes(job.type) ? job.type : 'full',
        description: job.description || '',
        salary_min: null,
        salary_max: null,
      });

      const roleAndDomain = await resolveRoleAndDomain(base44, job.title);

      const payload = {
        title: jobData.title,
        // Anonymized - no real company name, no logo, no contact details
        company: ANON_COMPANY,
        company_initials: 'חמ',
        company_color: getColor(job.title),
        location: jobData.location || 'חיפה וסביבתה',
        category: jobData.category || 'כללי',
        type: jobData.type,
        description: jobData.description || '',
        salary_min: jobData.salary_min || null,
        salary_max: jobData.salary_max || null,
        employer_id: EMPLOYER_ID,
        external_id: job.external_id || null,
        is_anonymous: true,
        show_company_name: false,
        show_company_info: false,
        show_contact_details: false,
        contact_email: null,
        contact_phone: null,
        is_closed: false,
        domain_id: roleAndDomain?.domain_id || null,
        role_id: roleAndDomain?.role_id || null,
      };

      if (existingJob) {
        // Re-open if it was closed, update data
        await base44.asServiceRole.entities.Job.update(existingJob.id, {
          ...payload,
          views: existingJob.views || 0,
        });
        updated++;
      } else {
        await base44.asServiceRole.entities.Job.create({ ...payload, views: 0 });
        created++;
      }
    }

    if (source?.id) {
      await base44.asServiceRole.entities.ImportSource.update(source.id, {
        last_sync_status: 'success',
        last_sync: new Date().toISOString(),
        last_error: '',
        jobs_added: (source.jobs_added || 0) + created,
        jobs_updated: (source.jobs_updated || 0) + updated,
        jobs_closed: (source.jobs_closed || 0) + closed,
        logs: `${new Date().toLocaleString('he-IL')} - נוצרו: ${created}, עודכנו: ${updated}, נסגרו: ${closed}`
      });
    }

    return Response.json({
      success: true,
      pages_scraped: pages.length,
      total_found: allJobs.length,
      unique_found: unique.length,
      created,
      updated,
      closed,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});