import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COLORS = ['#3da8c8','#e74c3c','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e67e22','#3498db'];
const MAX_PAGES = 25;
const DELAY_MS = 1500;
const MAX_JOBS_TOTAL = 500;

function getColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPage(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });
    if (!resp.ok) return { ok: false, status: resp.status, text: '' };
    const text = await resp.text();
    return { ok: true, status: resp.status, text };
  } catch (err) {
    return { ok: false, status: 0, error: err.message, text: '' };
  }
}

// Extract job listing links from a page using AI
async function extractJobLinks(base44, pageText, baseUrl, pageUrl) {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are analyzing an HTML career/jobs page.

Base URL: ${baseUrl}
Page URL: ${pageUrl}

TASK 1 - Job Links: Find all links that lead to individual job detail pages.
Return relative or absolute URLs only (no javascript:void, no #, no mailto).
Prioritize links that contain words like: job, position, career, משרה, קריירה, vacancy, opening, role.
Also look for data attributes, API endpoints, or script tags that contain job data (e.g., data-job-id, /api/jobs, job IDs).
If you find job IDs in JSON or query params, construct valid URLs.

TASK 2 - Next Page: Find the URL for the NEXT page (pagination, "הבא", "next", page number links, or API endpoints for pagination).
If there's no next page, return null.

TASK 3 - Job Count hint: If visible, how many total jobs are on this site?

HTML (truncated to 80000 chars):
${pageText.slice(0, 80000)}`,
    response_json_schema: {
      type: "object",
      properties: {
        job_links: { type: "array", items: { type: "string" } },
        next_page_url: { type: "string" },
        estimated_total: { type: "number" },
        pagination_type: { type: "string" }
      }
    }
  });
  return result || { job_links: [], next_page_url: null };
}

// Extract full job details from a single job page
async function extractJobDetails(base44, pageText, jobUrl, companyName) {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Extract job details from this job posting page. Be thorough — extract ALL available information.

Job URL: ${jobUrl}
Known company (for internal use only, DO NOT include in output): ${companyName}

Extract:
- title: job title in Hebrew (improve if needed)
- description: full job description in Hebrew, clean and formatted. Remove company name, contact details, external links. Keep requirements, responsibilities, benefits.
- location: city in Hebrew
- category: one of: פיתוח תוכנה, עיצוב, שיווק, מכירות, כספים, HR, הנדסה, רפואה, חינוך, לוגיסטיקה, מסעדנות, שירות לקוחות, בנייה, סייבר, ביולוגיה, כימיה, תעשייה ותשתיות, אחר
- type: one of full/part/remote/daily (default: full)
- salary_min: monthly gross in NIS as number (ONLY if explicitly stated, else null)
- salary_max: monthly gross in NIS as number (ONLY if explicitly stated, else null)
- external_id: job ID/reference number if found
- department: department name if found
- requirements: key requirements as a short bullet list in Hebrew

Rules:
- DO NOT invent salary if not stated
- DO NOT include company name in title or description
- DO NOT include contact details, phone, email
- Translate to Hebrew if content is in English
- Make description readable and professional

HTML content (truncated):
${pageText.slice(0, 80000)}`,
    response_json_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        location: { type: "string" },
        category: { type: "string" },
        type: { type: "string" },
        salary_min: { type: "number" },
        salary_max: { type: "number" },
        external_id: { type: "string" },
        department: { type: "string" },
        requirements: { type: "string" }
      }
    }
  });
  return result;
}

function resolveUrl(href, baseUrl) {
  try {
    if (!href) return null;
    href = href.trim();
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    const base = new URL(baseUrl);
    if (href.startsWith('/')) return `${base.protocol}//${base.host}${href}`;
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function getBaseUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try { body = JSON.parse(await req.text()); } catch {}

    const { url: startUrl, source_id, company_name = 'חברה מובילה', max_pages = MAX_PAGES } = body;

    if (!startUrl) return Response.json({ error: 'חסר URL' }, { status: 400 });

    const log = [];
    const errors = [];
    const addLog = (msg) => { console.log(msg); log.push(msg); };

    let source = null;
    if (source_id) {
      source = await base44.asServiceRole.entities.ImportSource.get(source_id);
      await base44.asServiceRole.entities.ImportSource.update(source_id, {
        last_sync_status: 'pending', last_error: '',
        logs: `${new Date().toLocaleString('he-IL')} - מתחיל סריקה...`
      });
    }

    addLog(`🚀 מתחיל סריקה: ${startUrl}`);
    const baseUrl = getBaseUrl(startUrl);
    const EMPLOYER_ID = source_id ? `crawl_${source_id}` : `crawl_${Date.now()}`;
    const validTypes = ['full', 'part', 'daily', 'remote'];

    // Step 1: Crawl pages to collect all job links
    const allJobLinks = new Set();
    let currentUrl = startUrl;
    let pageNum = 0;
    let pagesScanned = 0;

    while (currentUrl && pageNum < max_pages && allJobLinks.size < MAX_JOBS_TOTAL) {
      pageNum++;
      addLog(`📄 עמוד ${pageNum}: ${currentUrl}`);

      const { ok, status, text, error: fetchError } = await fetchPage(currentUrl);
      if (!ok) {
        errors.push({ page: pageNum, url: currentUrl, error: `HTTP ${status}${fetchError ? ': ' + fetchError : ''}` });
        addLog(`❌ שגיאת טעינה: ${status}`);
        break;
      }

      const extracted = await extractJobLinks(base44, text, baseUrl, currentUrl);
      pagesScanned++;

      const links = (extracted.job_links || [])
        .map(href => resolveUrl(href, currentUrl))
        .filter(Boolean)
        .filter(l => l.startsWith('http'));

      addLog(`✅ נמצאו ${links.length} קישורי משרות בעמוד ${pageNum}`);
      links.forEach(l => allJobLinks.add(l));

      const nextRaw = extracted.next_page_url;
      const nextUrl = nextRaw ? resolveUrl(nextRaw, currentUrl) : null;

      if (nextUrl && nextUrl !== currentUrl && !nextUrl.includes('javascript')) {
        currentUrl = nextUrl;
        await sleep(DELAY_MS);
      } else {
        addLog(`🏁 אין עמוד הבא, סיים ניווט`);
        break;
      }
    }

    addLog(`📋 סך הכל קישורי משרות: ${allJobLinks.size}`);

    if (allJobLinks.size === 0) {
      const errMsg = 'לא נמצאו קישורי משרות בעמוד';
      if (source_id) {
        await base44.asServiceRole.entities.ImportSource.update(source_id, {
          last_sync_status: 'error', last_error: errMsg,
          last_sync: new Date().toISOString(), logs: log.join('\n')
        });
      }
      return Response.json({ success: false, error: errMsg, log, errors });
    }

    // Step 2: Fetch existing jobs for dedup
    const existing = await base44.asServiceRole.entities.Job.filter({ employer_id: EMPLOYER_ID }, '-created_date', 1000);
    const existingByExtId = {};
    const existingByTitle = {};
    for (const j of existing) {
      if (j.external_id) existingByExtId[j.external_id] = j;
      if (j.title) existingByTitle[j.title.trim()] = j;
    }

    const currentLinks = Array.from(allJobLinks);
    const currentExtIds = new Set();
    let created = 0, updated = 0, closed = 0, dupes = 0, jobErrors = 0;

    // Step 3: Process each job page
    for (let i = 0; i < currentLinks.length; i++) {
      const jobUrl = currentLinks[i];
      addLog(`🔍 [${i + 1}/${currentLinks.length}] ${jobUrl}`);

      await sleep(DELAY_MS);

      const { ok, status, text } = await fetchPage(jobUrl);
      if (!ok) {
        errors.push({ job_url: jobUrl, error: `HTTP ${status}` });
        jobErrors++;
        continue;
      }

      const details = await extractJobDetails(base44, text, jobUrl, company_name);
      if (!details?.title) {
        errors.push({ job_url: jobUrl, error: 'לא ניתן לחלץ פרטי משרה' });
        jobErrors++;
        continue;
      }

      const extId = details.external_id || null;
      if (extId) currentExtIds.add(extId);

      // Dedup check
      const existingByExt = extId ? existingByExtId[extId] : null;
      const existingByT = existingByTitle[details.title?.trim()];
      const existingJob = existingByExt || existingByT;

      if (existingJob && (existingByExt || existingByT)) dupes++;

      let fullDesc = (details.description || '').trim();
      if (details.requirements) fullDesc += `\n\n**דרישות:**\n${details.requirements}`;

      const payload = {
        title: details.title,
        company: 'חברה מובילה',
        company_initials: 'חמ',
        company_color: getColor(details.title),
        location: details.location || 'ישראל',
        category: details.category || 'אחר',
        type: validTypes.includes(details.type) ? details.type : 'full',
        description: fullDesc,
        salary_min: details.salary_min || null,
        salary_max: details.salary_max || null,
        employer_id: EMPLOYER_ID,
        external_id: extId,
        is_anonymous: true,
        show_company_name: false,
        show_company_info: false,
        show_contact_details: false,
        contact_email: null,
        contact_phone: null,
        is_closed: false,
      };

      if (existingJob) {
        await base44.asServiceRole.entities.Job.update(existingJob.id, { ...payload, views: existingJob.views || 0 });
        updated++;
        if (extId) existingByExtId[extId] = { ...existingJob, ...payload };
      } else {
        const newJob = await base44.asServiceRole.entities.Job.create({ ...payload, views: 0 });
        if (extId) existingByExtId[extId] = newJob;
        if (details.title) existingByTitle[details.title.trim()] = newJob;
        created++;
      }
    }

    // Step 4: Close jobs no longer in source
    for (const existingJob of existing) {
      const key = existingJob.external_id;
      if (key && !currentExtIds.has(key) && !existingJob.is_closed) {
        await base44.asServiceRole.entities.Job.update(existingJob.id, { is_closed: true });
        closed++;
      }
    }

    const summary = `נסרקו ${pagesScanned} עמודים | נמצאו ${allJobLinks.size} משרות | חדשות: ${created} | עודכנו: ${updated} | נסגרו: ${closed} | שגיאות: ${jobErrors}`;
    addLog(`✅ ${summary}`);

    if (source_id) {
      await base44.asServiceRole.entities.ImportSource.update(source_id, {
        last_sync_status: jobErrors > 0 && created === 0 ? 'error' : 'success',
        last_sync: new Date().toISOString(),
        last_error: jobErrors > 0 ? `${jobErrors} שגיאות` : '',
        jobs_added: (source?.jobs_added || 0) + created,
        jobs_updated: (source?.jobs_updated || 0) + updated,
        jobs_closed: (source?.jobs_closed || 0) + closed,
        logs: log.slice(-50).join('\n'),
      });
    }

    return Response.json({
      success: true,
      pages_scanned: pagesScanned,
      job_links_found: allJobLinks.size,
      created,
      updated,
      closed,
      duplicates: dupes,
      errors_count: jobErrors,
      errors,
      log,
      summary,
    });

  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});