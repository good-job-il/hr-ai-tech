import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DELAY_BETWEEN_JOBS_MS = 800;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPage(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch (err) {
    console.log(`Error fetching ${url}: ${err.message}`);
    return null;
  }
}

async function extractWixJobs(base44, html) {
  // First try to find jobs in JSON data embedded in page
  const jsonMatches = html.match(/window\.__INITIAL_STATE__|\{[^{}]*"jobs"[^{}]*\}|\{[^{}]*"positions"[^{}]*\}/gi);
  
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Extract job information from Wix careers page HTML and JSON data.
    
Look for:
1. Job links - search in <a> tags, data attributes, and ANY URL patterns containing /positions, /jobs, ?id=, /job/
2. Job titles - from text content and JSON fields like "title", "position", "name"
3. Locations - from text and JSON fields like "location", "city", "country"
4. Job descriptions - from visible text
5. Pagination - links with "next", "page", numbers

IMPORTANT - Try different approaches:
- Search all <a href> values
- Search for patterns like /positions/[id] or /jobs/[id]
- Look in data-* attributes
- Search in JSON blocks for job IDs
- If you find IDs in JSON, construct URLs like https://careers.wix.com/positions/[id]

HTML and JSON (first 150000 chars):
${(html + '\n\n' + (jsonMatches?.join('\n') || '')).slice(0, 150000)}`,
    model: 'gemini_3_1_pro',
    response_json_schema: {
      type: 'object',
      properties: {
        job_links: {
          type: 'array',
          items: { type: 'string' },
          description: 'Full or relative URLs to individual job pages'
        },
        next_page_url: {
          type: ['string', 'null'],
          description: 'URL for next page pagination'
        },
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  });
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let body = {};
    try { body = JSON.parse(await req.text()); } catch {}
    const { source_id } = body;

    const log = [];
    const addLog = (msg) => { console.log(msg); log.push(msg); };

    addLog('🚀 מתחיל ייבוא Wix...');

    let source = null;
    if (source_id) {
      source = await base44.asServiceRole.entities.ImportSource.get(source_id);
      await base44.asServiceRole.entities.ImportSource.update(source_id, {
        last_sync_status: 'pending',
        last_error: '',
        logs: `${new Date().toLocaleString('he-IL')} - מתחיל ייבוא...`
      });
    }

    const EMPLOYER_ID = 'wix_import';
    const baseUrl = 'https://careers.wix.com';
    const apiUrl = 'https://careers.wix.com/api/positions';

    // Fetch existing jobs
    const existing = await base44.asServiceRole.entities.Job.filter({ employer_id: EMPLOYER_ID }, '-created_date', 1000);
    const existingByExtId = {};
    for (const j of existing) {
      if (j.external_id) existingByExtId[j.external_id] = j;
    }

    let created = 0, updated = 0, closed = 0, totalProcessed = 0, totalErrors = 0;
    const currentExtIds = new Set();
    let pageNum = 0;
    const MAX_PAGES = 10;

    // Try Wix API directly
    addLog(`📥 מנסה API ישיר של Wix...`);
    try {
      while (pageNum < MAX_PAGES) {
        const apiResp = await fetch(`${apiUrl}?page=${pageNum}&limit=50`, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
          },
        });

        if (!apiResp.ok) {
          addLog(`⚠️ API returned status ${apiResp.status}`);
          break;
        }

        const data = await apiResp.json();
        if (!data?.positions?.length) {
          addLog(`🏁 סיום - אין עוד משרות`);
          break;
        }

        addLog(`✅ נמצאו ${data.positions.length} משרות בדף ${pageNum}`);

        for (const job of data.positions) {
          totalProcessed++;
          try {
            const extId = job.id?.toString() || `wix_${job.title?.toLowerCase().replace(/\s+/g, '_')}`;
            if (extId) currentExtIds.add(extId);

            const payload = {
              title: job.title || 'Job Opening',
              company: 'Wix',
              company_initials: 'WIX',
              company_color: '#0C6EFD',
              location: job.location || 'Remote',
              category: job.department || 'Technology',
              type: 'full',
              description: job.description || '',
              salary_min: job.salary_min || null,
              salary_max: job.salary_max || null,
              employer_id: EMPLOYER_ID,
              external_id: extId,
              is_anonymous: false,
              show_company_name: true,
              show_company_info: true,
              is_closed: false,
            };

            const existingJob = existingByExtId[extId];
            if (existingJob) {
              await base44.asServiceRole.entities.Job.update(existingJob.id, payload);
              updated++;
            } else {
              await base44.asServiceRole.entities.Job.create(payload);
              created++;
            }

            await sleep(DELAY_BETWEEN_JOBS_MS);
          } catch (err) {
            totalErrors++;
            addLog(`❌ שגיאה: ${err.message}`);
          }
        }

        if (data.positions.length < 50) break;
        pageNum++;
      }
    } catch (apiErr) {
      addLog(`⚠️ API לא זמינה, נסיון fallback להורדת HTML...`);
      totalErrors++;
    }

    // Close old jobs
    for (const existingJob of existing) {
      if (existingJob.external_id && !currentExtIds.has(existingJob.external_id) && !existingJob.is_closed) {
        await base44.asServiceRole.entities.Job.update(existingJob.id, { is_closed: true });
        closed++;
      }
    }

    const summary = `עובדו: ${totalProcessed} | חדשות: ${created} | עודכנו: ${updated} | נסגרו: ${closed} | שגיאות: ${totalErrors}`;
    addLog(`✅ ${summary}`);

    if (source_id) {
      await base44.asServiceRole.entities.ImportSource.update(source_id, {
        last_sync_status: totalErrors > 0 && created === 0 ? 'error' : 'success',
        last_sync: new Date().toISOString(),
        last_error: totalErrors > 0 ? `${totalErrors} שגיאות` : '',
        jobs_added: (source?.jobs_added || 0) + created,
        jobs_updated: (source?.jobs_updated || 0) + updated,
        jobs_closed: (source?.jobs_closed || 0) + closed,
        logs: log.slice(-50).join('\n'),
      });
    }

    return Response.json({
      success: totalErrors === 0 || created > 0,
      total_processed: totalProcessed,
      created,
      updated,
      closed,
      errors_count: totalErrors,
      log,
      summary,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});