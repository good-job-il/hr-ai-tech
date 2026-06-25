import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Create multiple candidate records from parsed resume data
 * Handles DOCX conversion and timeline creation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidates_data, import_batch_id } = await req.json();

    if (!Array.isArray(candidates_data) || candidates_data.length === 0) {
      return Response.json({ error: 'Invalid candidates_data' }, { status: 400 });
    }

    // Use background queue processor for actual creation
    const queueResult = await base44.functions.invoke('importQueueProcessor', {
      import_batch_id,
      candidates_to_create: candidates_data
    });

    return Response.json(queueResult);
  } catch (error) {
    console.error('[createBulkCandidates] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});