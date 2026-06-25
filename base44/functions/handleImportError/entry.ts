import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Detailed error logging and reporting for import failures
 * Provides structured error information with context and recovery suggestions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { 
      source_id, 
      error_message, 
      error_code, 
      failed_items = [], 
      timestamp = new Date().toISOString(),
      recovery_suggestion = '' 
    } = payload;

    if (!source_id || !error_message) {
      return Response.json({ error: 'source_id and error_message required' }, { status: 400 });
    }

    // Log the error with full context
    const errorLog = {
      source_id,
      error_message,
      error_code,
      failed_items: failed_items.slice(0, 10), // Keep first 10 items
      failed_count: failed_items.length,
      timestamp,
      recovery_suggestion,
      details: {
        timestamp: new Date(timestamp).toLocaleString('he-IL'),
        item_count: failed_items.length,
        affected_sources: [...new Set(failed_items.map(item => item.source))]
      }
    };

    // Update import source with error details
    const source = await base44.asServiceRole.entities.ImportSource.get(source_id);
    if (source) {
      await base44.asServiceRole.entities.ImportSource.update(source_id, {
        last_sync_status: 'error',
        last_error: JSON.stringify(errorLog),
        last_sync: timestamp
      });
    }

    // Log to console for monitoring
    console.error('[IMPORT_ERROR]', JSON.stringify(errorLog, null, 2));

    return Response.json({
      success: true,
      error_id: source_id,
      logged_items: Math.min(failed_items.length, 10),
      recovery_suggestion
    });
  } catch (error) {
    console.error('[ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});