import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active import sources
    const sources = await base44.asServiceRole.entities.ImportSource.filter({
      is_active: true
    }, '-created_date', 100);

    const results = [];

    for (const source of sources) {
      try {
        const name = (source.name || '').toLowerCase();
        const provider = (source.provider || '').toLowerCase();
        const url = (source.url || '').toLowerCase();

        let functionName = 'importNovolog'; // default

        if (name.includes('alljobs') || provider.includes('alljobs') || url.includes('alljobs')) {
          functionName = 'importAlljobs';
        } else if (name.includes('שפיר') || provider.includes('shafir') || url.includes('shafir')) {
          functionName = 'importShafir';
        } else if (name.includes('אלביט') || provider.includes('elbit') || url.includes('elbit')) {
          functionName = 'importElbit';
        } else if (name.includes('נובולוג') || provider.includes('novolog') || url.includes('novolog') || url.includes('adamtotal')) {
          functionName = 'importNovolog';
        } else if (name.includes('jobicy') || provider.includes('jobicy') || url.includes('jobicy')) {
          functionName = 'importJobicy';
        }

        // Invoke the appropriate import function (pass source data)
        const result = await base44.asServiceRole.functions.invoke(functionName, {
          source_id: source.id,
          url: source.url,
          provider: source.provider
        });

        // Update source status
        await base44.asServiceRole.entities.ImportSource.update(source.id, {
          last_sync: new Date().toISOString(),
          last_sync_status: 'success',
          last_error: null,
        });

        results.push({
          source_id: source.id,
          status: 'success',
          jobs_added: result?.jobs_added || 0
        });
      } catch (error) {
        // Update source with error
        await base44.asServiceRole.entities.ImportSource.update(source.id, {
          last_sync: new Date().toISOString(),
          last_sync_status: 'error',
          last_error: error.message,
        }).catch(() => {});

        results.push({
          source_id: source.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      status: 'completed',
      sources_processed: sources.length,
      results
    });
  } catch (error) {
    return Response.json({
      error: error.message,
      status: 'failed'
    }, { status: 500 });
  }
});