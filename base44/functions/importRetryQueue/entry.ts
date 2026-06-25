import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Manages retry queue for failed imports
// Runs periodically to retry failed imports with exponential backoff

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all sources
    const sources = await base44.asServiceRole.entities.ImportSource.list('-last_sync', 500);
    const now = new Date();
    const retryResults = [];

    for (const source of sources) {
      // Skip if successful or if last sync was too recent
      if (source.last_sync_status === 'success') continue;
      if (source.last_sync_status === 'pending') continue;

      // Check if we should retry based on exponential backoff
      const lastSync = source.last_sync ? new Date(source.last_sync) : null;
      if (!lastSync) continue;

      const minutesSinceSyncFailed = (now - lastSync) / (1000 * 60);
      const shouldRetry = shouldRetrySource(source, minutesSinceSyncFailed);

      if (!shouldRetry) continue;

      // Attempt to re-import
      console.log(`[RetryQueue] Retrying import for source: ${source.name}`);

      try {
        let importFunction;
        const provider = (source.provider || '').toLowerCase();

        if (provider.includes('nvidia')) {
          importFunction = 'importNvidia';
        } else if (provider.includes('novolog')) {
          importFunction = 'importNovolog';
        } else if (provider.includes('alljobs')) {
          importFunction = 'importAlljobs';
        } else if (provider.includes('jobicy')) {
          importFunction = 'importJobicy';
        } else if (provider.includes('shafir')) {
          importFunction = 'importShafir';
        } else if (provider.includes('elbit')) {
          importFunction = 'importElbit';
        } else {
          continue; // Unknown provider
        }

        const result = await base44.asServiceRole.functions.invoke(importFunction, {
          source_id: source.id,
          url: source.url,
        });

        // Mark retry as attempted
        const retryCount = (source.retry_count || 0) + 1;
        await base44.asServiceRole.entities.ImportSource.update(source.id, {
          retry_count: retryCount,
          last_retry_attempt: new Date().toISOString(),
        });

        retryResults.push({
          source: source.name,
          status: 'attempted',
          result: result.data,
        });
      } catch (error) {
        console.error(`[RetryQueue] Retry failed for ${source.name}: ${error.message}`);
        
        const retryCount = (source.retry_count || 0) + 1;
        await base44.asServiceRole.entities.ImportSource.update(source.id, {
          retry_count: retryCount,
          last_retry_attempt: new Date().toISOString(),
          last_error: `Retry ${retryCount}: ${error.message}`,
        });

        retryResults.push({
          source: source.name,
          status: 'failed',
          error: error.message,
          retryCount,
        });
      }
    }

    return Response.json({
      success: true,
      retried: retryResults.length,
      results: retryResults,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function shouldRetrySource(source, minutesElapsed) {
  const retryCount = source.retry_count || 0;

  // Never retry more than 5 times
  if (retryCount >= 5) return false;

  // Exponential backoff: 5 min, 15 min, 45 min, 2h, 6h
  const backoffMinutes = [5, 15, 45, 120, 360];
  const requiredWait = backoffMinutes[Math.min(retryCount, backoffMinutes.length - 1)];

  return minutesElapsed >= requiredWait;
}