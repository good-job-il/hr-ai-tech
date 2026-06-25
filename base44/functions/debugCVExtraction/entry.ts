/**
 * debugCVExtraction
 * Debug function to show LLM extraction for each CV
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all Candidates from pool
    const candidates = await base44.asServiceRole.entities.Candidate.filter({ source: 'pool' }, '-created_date', 50);
    
    // Get all Documents
    const documents = await base44.asServiceRole.entities.CandidateDocument.list('-uploaded_at', 100);
    
    const report = [];
    
    for (const candidate of candidates) {
      const docs = documents.filter(d => d.candidate_id === candidate.id);
      
      report.push({
        candidate_id: candidate.id,
        candidate_full_name: candidate.full_name,
        candidate_email: candidate.email,
        candidate_phone: candidate.phone,
        created_date: candidate.created_date,
        updated_date: candidate.updated_date,
        source: candidate.source,
        resume_filename: candidate.resume_filename,
        resume_url: candidate.resume_url,
        documents: docs.map(d => ({
          doc_id: d.id,
          filename: d.filename,
          original_filename: d.original_filename,
          file_url: d.file_url,
          uploaded_at: d.uploaded_at,
        })),
        parsing_status: candidate.parsing_status,
        parsing_confidence: candidate.parsing_confidence,
        skills: candidate.skills,
        domain_name: candidate.domain_name,
        role_name: candidate.role_name,
      });
    }
    
    return Response.json({
      total_candidates: candidates.length,
      report: report,
      analysis: {
        candidates_with_same_email: report.reduce((acc, c) => {
          acc[c.candidate_email] = (acc[c.candidate_email] || 0) + 1;
          return acc;
        }, {}),
        candidates_with_same_phone: report.reduce((acc, c) => {
          if (c.candidate_phone) {
            acc[c.candidate_phone] = (acc[c.candidate_phone] || 0) + 1;
          }
          return acc;
        }, {}),
      }
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});