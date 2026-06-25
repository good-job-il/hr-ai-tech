import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Process import queue in background
 * Handles batch candidate creation with retries
 * Updates progress in real-time
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { import_batch_id, candidates_to_create } = await req.json();

    if (!import_batch_id || !Array.isArray(candidates_to_create)) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    const results = {
      total: candidates_to_create.length,
      created: [],
      failed: [],
      duplicates: [],
      errors: []
    };

    const batch = await base44.entities.CandidateImportBatch.get(import_batch_id);

    // Update batch status
    await base44.entities.CandidateImportBatch.update(import_batch_id, {
      status: 'in_progress',
      processing_started_at: new Date().toISOString()
    });

    // Process each candidate
    for (let i = 0; i < candidates_to_create.length; i++) {
      const candidateData = candidates_to_create[i];

      try {
        // Check for duplicates
        const dupResult = await base44.functions.invoke('detectDuplicateAdvanced', {
          full_name: candidateData.full_name,
          email: candidateData.email,
          phone: candidateData.phone,
          employer_id: candidateData.employer_id,
          parsed_text: candidateData.summary || '',
          resume_hash: candidateData.resume_hash
        });

        if (dupResult.data?.has_duplicates && dupResult.data.highest_confidence >= 0.8) {
          results.duplicates.push({
            candidate: candidateData.full_name,
            reason: dupResult.data.duplicates[0]?.reason,
            existing_id: dupResult.data.duplicates[0]?.existing_candidate?.id,
            confidence: dupResult.data.highest_confidence
          });
          continue;
        }

        // Create candidate with retries
        let created = false;
        let retries = 3;

        while (!created && retries > 0) {
          try {
            const newCandidate = await base44.entities.Candidate.create(candidateData);

            // Create timeline entries
            await Promise.all([
              base44.functions.invoke('createCandidateTimeline', {
                candidate_email: newCandidate.email || 'unknown',
                event_type: 'imported',
                description: `יובא מ-${candidateData.source || 'ZIP import'}`,
                metadata: { import_batch_id }
              }),
              base44.functions.invoke('createCandidateTimeline', {
                candidate_email: newCandidate.email || 'unknown',
                event_type: 'resume_uploaded',
                description: 'קורות חיים העלו',
                metadata: { filename: candidateData.original_resume_filename, batch_id: import_batch_id }
              })
            ]).catch(() => {});

            results.created.push({
              id: newCandidate.id,
              name: newCandidate.full_name,
              email: newCandidate.email
            });

            created = true;
          } catch (retryErr) {
            retries--;
            if (retries === 0) throw retryErr;
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (err) {
        results.failed.push({
          name: candidateData.full_name,
          email: candidateData.email,
          error: err.message
        });
        results.errors.push({
          row: i + 1,
          name: candidateData.full_name,
          error: err.message
        });
      }

      // Update progress every 5 records
      if ((i + 1) % 5 === 0) {
        await base44.entities.CandidateImportBatch.update(import_batch_id, {
          successful_imports: results.created.length,
          failed_imports: results.failed.length,
          duplicate_found: results.duplicates.length
        }).catch(() => {});
      }
    }

    // Final update
    const stats = calculateStats(results, candidates_to_create);
    await base44.entities.CandidateImportBatch.update(import_batch_id, {
      status: results.failed.length === 0 ? 'completed' : 'completed',
      successful_imports: results.created.length,
      failed_imports: results.failed.length,
      duplicate_found: results.duplicates.length,
      processing_completed_at: new Date().toISOString(),
      summary: {
        total: results.total,
        created: results.created.length,
        failed: results.failed.length,
        duplicates: results.duplicates.length,
        success_rate: (results.created.length / results.total * 100).toFixed(1)
      }
    }).catch(() => {});

    return Response.json(results);
  } catch (error) {
    console.error('[importQueueProcessor] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateStats(results, originalCandidates) {
  const missingEmail = originalCandidates.filter(c => !c.email).length;
  const missingPhone = originalCandidates.filter(c => !c.phone).length;
  const missingRole = originalCandidates.filter(c => !c.role_name).length;

  return {
    total: results.total,
    created: results.created.length,
    failed: results.failed.length,
    duplicates: results.duplicates.length,
    missing_email: missingEmail,
    missing_phone: missingPhone,
    missing_role: missingRole,
    success_rate: `${(results.created.length / results.total * 100).toFixed(1)}%`
  };
}