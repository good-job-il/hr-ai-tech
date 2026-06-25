import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COLORS = ['#3da8c8','#e74c3c','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e67e22','#3498db'];
const ANON_COMPANY = 'חברה מובילה';
const EMPLOYER_ID = 'novolog_import';

function getColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

async function resolveRoleAndDomain(base44, jobTitle) {
  try {
    const roles = await base44.asServiceRole.entities.Role.list('-role_id', 500);
    const aliases = await base44.asServiceRole.entities.RoleAlias.list('-created_date', 500);
    const domains = await base44.asServiceRole.entities.Domain.list('-domain_id', 500);
    
    const titleLower = jobTitle.toLowerCase().trim();
    
    // Try to find matching alias
    const matchingAlias = aliases.find(a => a.alias.toLowerCase() === titleLower);
    if (matchingAlias) {
      const role = roles.find(r => r.name === matchingAlias.canonical_role);
      if (role && role.domain_id) {
        return { role_id: role.role_id, domain_id: role.domain_id };
      }
    }
    
    // Try to find exact role match
    const exactRole = roles.find(r => r.name.toLowerCase() === titleLower);
    if (exactRole && exactRole.domain_id) {
      return { role_id: exactRole.role_id, domain_id: exactRole.domain_id };
    }
    
    // Try partial match on role name
    const partialRole = roles.find(r => r.name.toLowerCase().includes(titleLower.split(/\s+/)[0]));
    if (partialRole && partialRole.domain_id) {
      return { role_id: partialRole.role_id, domain_id: partialRole.domain_id };
    }
    
    // Fallback: return null (will be marked for review)
    return null;
  } catch (err) {
    console.error('Error resolving role:', err);
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
השלם את השדות החסרים עם מידע הגיוני ואמין בהתאם לנתוני שוק 2024-2025.

משרה:
- כותרת: ${job.title}
- מיקום: ${job.location || 'לא צוין'}
- קטגוריה: ${job.category || 'לא צוין'}
- סוג: ${job.type}
- תיאור קיים: ${job.description || 'אין'}

השדות שיש להשלים: ${missingFields.join(', ')}

כללים:
- salary_min ו-salary_max: שכר ברוטו חודשי בשקלים (מספר בלבד). אם daily - טווח יומי (200-600).
- description: 2-3 משפטים בעברית. ללא שם חברה, ללא פרטי קשר.
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
    let feedUrl;

    if (body.source_id) {
      source = await base44.asServiceRole.entities.ImportSource.get(body.source_id);
      if (!source) return Response.json({ error: 'מקור לא נמצא' }, { status: 404 });
      feedUrl = source.url;
    } else if (body.url) {
      feedUrl = body.url;
    } else {
      const sources = await base44.asServiceRole.entities.ImportSource.filter({ name: 'נובולוג' }, '-created_date', 1);
      source = sources?.[0];
      if (!source) return Response.json({ error: 'מקור נובולוג לא נמצא' }, { status: 404 });
      feedUrl = source.url;
    }

    if (!feedUrl) return Response.json({ error: 'URL לא הוגדר במקור' }, { status: 400 });

    if (source?.id) {
      await base44.asServiceRole.entities.ImportSource.update(source.id, {
        last_sync_status: 'pending',
        last_error: ''
      });
    }

    const resp = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HeadHunter/1.0)',
        'Accept': 'application/json, text/xml, application/xml, */*',
      }
    });

    if (!resp.ok) {
      if (source?.id) {
        await base44.asServiceRole.entities.ImportSource.update(source.id, {
          last_sync_status: 'error',
          last_error: `HTTP ${resp.status}: ${resp.statusText}`,
          last_sync: new Date().toISOString(),
        });
      }
      return Response.json({ error: `Feed error: HTTP ${resp.status}` }, { status: 400 });
    }

    const text = await resp.text();

    const parseResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `אתה מנתח פידים של משרות עבודה.
קבל את תוכן הפיד הבא (JSON או XML) וחלץ את כל המשרות.

תוכן הפיד (עד 100000 תווים):
${text.slice(0, 100000)}

עבור כל משרה חלץ:
- title: כותרת המשרה (עברית בלבד, אל תכלול URL או קישור)
- location: מיקום (עיר בעברית, לא URL)
- category: תחום/קטגוריה (לא URL)
- type: סוג משרה (full/part/remote/daily בלבד)
- description: תיאור המשרה - הסר פרטי קשר, שם חברה, אימייל, טלפון, URL
- salary_min: שכר מינימום (מספר בלבד) - אם קיים
- salary_max: שכר מקסימום (מספר בלבד) - אם קיים
- external_id: מזהה חיצוני אם קיים (מספר או קוד קצר בלבד)

חשוב: אל תכלול בשום שדה: שם חברה, אימייל, טלפון, לוגו, פרטי קשר, URL, קישור.
החזר JSON בלבד - כל שדה חייב להיות תקין.`,
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
                salary_min: { type: "number" },
                salary_max: { type: "number" },
                external_id: { type: "string" }
              }
            }
          }
        }
      }
    });

    let rawJobs = parseResult?.jobs || [];
    
    // Clean up URLs from fields
    rawJobs = rawJobs.map(job => ({
      ...job,
      title: (job.title || '').replace(/https?:\/\/[^\s]+|\.com|\.co\.il/gi, '').trim(),
      location: (job.location || '').replace(/https?:\/\/[^\s]+|\.com|\.co\.il/gi, '').trim(),
      category: (job.category || '').replace(/https?:\/\/[^\s]+|\.com|\.co\.il/gi, '').trim(),
      description: (job.description || '').replace(/https?:\/\/[^\s]+|אימייל:|טלפון:|email:|phone:/gi, '').trim(),
    })).filter(job => job.title && job.title.length > 2);

    if (rawJobs.length === 0) {
      if (source?.id) {
        await base44.asServiceRole.entities.ImportSource.update(source.id, {
          last_sync_status: 'error',
          last_error: 'לא נמצאו משרות בפיד. ייתכן שה-URL שגוי או הפיד ריק.',
          last_sync: new Date().toISOString(),
        });
      }
      return Response.json({ success: false, error: 'לא נמצאו משרות בפיד', raw_length: text.length });
    }

    // Deduplicate
    const seen = new Set();
    const unique = rawJobs.filter(j => {
      if (!j.title) return false;
      const key = j.external_id || j.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Fetch all existing from this source
    const existing = await base44.asServiceRole.entities.Job.filter({ employer_id: EMPLOYER_ID }, '-created_date', 500);
    const existingByKey = {};
    for (const j of existing) {
      const key = j.external_id || j.title;
      if (key) existingByKey[key] = j;
    }

    const currentKeys = new Set(unique.map(j => j.external_id || j.title));
    const validTypes = ['full', 'part', 'daily', 'remote'];
    let created = 0;
    let updated = 0;
    let closed = 0;

    // Close jobs no longer in feed
    for (const existingJob of existing) {
      const key = existingJob.external_id || existingJob.title;
      if (key && !currentKeys.has(key) && !existingJob.is_closed) {
        await base44.asServiceRole.entities.Job.update(existingJob.id, { is_closed: true });
        closed++;
      }
    }

    for (const job of unique) {
      const key = job.external_id || job.title;
      const existingJob = existingByKey[key];

      const jobData = await enrichAndAnonymize(base44, {
        title: job.title,
        location: job.location || '',
        category: job.category || '',
        type: validTypes.includes(job.type) ? job.type : 'full',
        description: job.description || '',
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
      });

      // Resolve role and domain from job title
      const roleAndDomain = await resolveRoleAndDomain(base44, job.title);

      const payload = {
        title: jobData.title,
        company: ANON_COMPANY,
        company_initials: 'חמ',
        company_color: getColor(job.title),
        location: jobData.location || 'ישראל',
        category: jobData.category || 'אחר',
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

    return Response.json({ success: true, total_in_feed: rawJobs.length, unique: unique.length, already_existed: unique.length - (created), created, updated, closed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});