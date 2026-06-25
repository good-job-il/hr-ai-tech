import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COLORS = ['#3da8c8','#e74c3c','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e67e22','#3498db'];
const BATCH_SIZE = 20;
const DELAY_BETWEEN_BATCHES_MS = 5000;
const DELAY_BETWEEN_JOBS_MS = 500;

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
    
    // Try partial match
    const partialRole = roles.find(r => r.name.toLowerCase().includes(titleLower.split(/\s+/)[0]));
    if (partialRole && partialRole.domain_id) {
      return { role_id: partialRole.role_id, domain_id: partialRole.domain_id };
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getNvidiaJobs(page = 0) {
  try {
    const resp = await fetch(`https://jobs.nvidia.com/api/jobs?start=${page * BATCH_SIZE}&limit=${BATCH_SIZE}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch (err) {
    console.log(`Error fetching page ${page}: ${err.message}`);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try { body = JSON.parse(await req.text()); } catch {}
    const { source_id } = body;

    const log = [];
    const addLog = (msg) => { console.log(msg); log.push(msg); };

    addLog('🚀 מתחיל ייבוא NVIDIA...');

    let source = null;
    if (source_id) {
      source = await base44.asServiceRole.entities.ImportSource.get(source_id);
      await base44.asServiceRole.entities.ImportSource.update(source_id, {
        last_sync_status: 'pending', last_error: '',
        logs: `${new Date().toLocaleString('he-IL')} - מתחיל ייבוא...`
      });
    }

    const EMPLOYER_ID = 'nvidia_import';
    const validTypes = ['full', 'part', 'daily', 'remote'];

    // Fetch existing jobs for dedup
    const existing = await base44.asServiceRole.entities.Job.filter({ employer_id: EMPLOYER_ID }, '-created_date', 1000);
    const existingByExtId = {};
    for (const j of existing) {
      if (j.external_id) existingByExtId[j.external_id] = j;
    }

    let created = 0, updated = 0, closed = 0, totalProcessed = 0, totalErrors = 0;
    const currentExtIds = new Set();
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      addLog(`📥 מוריד דף ${page}...`);
      
      const data = await getNvidiaJobs(page);
      if (!data?.jobs?.length) {
        addLog('🏁 סיום - אין עוד משרות');
        hasMore = false;
        break;
      }

      const jobsOnPage = data.jobs;
      addLog(`✅ נמצאו ${jobsOnPage.length} משרות בדף ${page}`);

      // Process batch with delays
      for (let i = 0; i < jobsOnPage.length; i++) {
        const job = jobsOnPage[i];
        totalProcessed++;

        try {
          const extId = job.id?.toString() || null;
          if (extId) currentExtIds.add(extId);

          // Parse location - keep English if not in Israel
          let location = job.locations?.[0]?.name || 'Remote';
          if (location.includes('Israel')) {
            location = 'ישראל';
          }

          // Keep title/description in English if they are
          const title = job.title || 'Job Opening';
          const description = (job.description || '').trim();

          // Resolve role and domain
          const roleAndDomain = await resolveRoleAndDomain(base44, title);

          const payload = {
            title,
            company: 'NVIDIA',
            company_initials: 'NV',
            company_color: '#76B900',
            location,
            category: job.categories?.[0]?.name || 'Engineering',
            type: job.employment_type?.toLowerCase().includes('full') ? 'full' : 'remote',
            description,
            salary_min: null,
            salary_max: null,
            employer_id: EMPLOYER_ID,
            external_id: extId,
            is_anonymous: false,
            show_company_name: true,
            show_company_info: true,
            show_contact_details: false,
            contact_email: null,
            contact_phone: null,
            is_closed: false,
            domain_id: roleAndDomain?.domain_id || null,
            role_id: roleAndDomain?.role_id || null,
          };

          const existingJob = extId ? existingByExtId[extId] : null;

          if (existingJob) {
            await base44.asServiceRole.entities.Job.update(existingJob.id, { ...payload, views: existingJob.views || 0 });
            updated++;
          } else {
            await base44.asServiceRole.entities.Job.create({ ...payload, views: 0 });
            created++;
          }
        } catch (err) {
          totalErrors++;
          addLog(`❌ שגיאה: ${err.message}`);
        }

        if ((i + 1) % BATCH_SIZE === 0) {
          addLog(`⏳ חכייה לפני הדף הבא...`);
          await sleep(DELAY_BETWEEN_BATCHES_MS);
        } else {
          await sleep(DELAY_BETWEEN_JOBS_MS);
        }
      }

      page++;
      if (jobsOnPage.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    // Close jobs no longer in source
    for (const existingJob of existing) {
      const key = existingJob.external_id;
      if (key && !currentExtIds.has(key) && !existingJob.is_closed) {
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