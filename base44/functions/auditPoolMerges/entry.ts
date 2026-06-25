/**
 * auditPoolMerges
 * Full audit report of all pool CVs and merges
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all pool candidates
    const candidates = await base44.asServiceRole.entities.Candidate.filter({ source: 'pool' }, '-created_date', 50);
    
    // Get all documents
    const documents = await base44.asServiceRole.entities.CandidateDocument.list('-uploaded_at', 100);
    
    // Get all timeline events
    const timeline = await base44.asServiceRole.entities.CandidateTimeline.list('-created_date', 200);
    
    // Build comprehensive report
    const report = [];
    
    for (const candidate of candidates) {
      const candidateDocs = documents.filter(d => d.candidate_id === candidate.id);
      const candidateTimeline = timeline.filter(t => t.candidate_id === candidate.id && t.event_type === 'imported');
      
      // Group documents by upload time proximity to timeline events
      const docTimelinePairs = [];
      
      for (const tlEvent of candidateTimeline) {
        const msgId = tlEvent.metadata?.email_message_id;
        const matchingDoc = candidateDocs.find(d => {
          const docTime = new Date(d.uploaded_at).getTime();
          const tlTime = new Date(tlEvent.created_date).getTime();
          return Math.abs(docTime - tlTime) < 120000; // Within 2 minutes
        });
        
        docTimelinePairs.push({
          timeline_event: tlEvent,
          document: matchingDoc,
          email_message_id: msgId,
        });
      }
      
      // Also include documents without timeline
      const unmatchedDocs = candidateDocs.filter(d => 
        !docTimelinePairs.some(p => p.document?.id === d.id)
      );
      
      report.push({
        candidate_id: candidate.id,
        candidate_full_name: candidate.full_name,
        candidate_email: candidate.email,
        candidate_phone: candidate.phone,
        created_date: candidate.created_date,
        updated_date: candidate.updated_date,
        is_duplicate_suspected: candidate.is_duplicate_suspected,
        review_required: candidate.review_required,
        duplicate_of_id: candidate.duplicate_of_id,
        documents_count: candidateDocs.length,
        timeline_events_count: candidateTimeline.length,
        documents: candidateDocs.map(d => ({
          doc_id: d.id,
          filename: d.filename,
          original_filename: d.original_filename,
          file_url: d.file_url,
          uploaded_at: d.uploaded_at,
        })),
        timeline_events: candidateTimeline.map(tl => ({
          timeline_id: tl.id,
          description: tl.description,
          created_date: tl.created_date,
          email_message_id: tl.metadata?.email_message_id,
          is_duplicate: tl.metadata?.is_duplicate,
          duplicate_reason: tl.metadata?.duplicate_reason,
          duplicate_confidence: tl.metadata?.duplicate_confidence,
          extracted_email: tl.metadata?.extracted_email,
          extracted_phone: tl.metadata?.extracted_phone,
          sender_email: tl.metadata?.sender_email,
          review_required: tl.metadata?.review_required,
        })),
        doc_timeline_pairs: docTimelinePairs.map(p => ({
          subject_from_description: p.timeline_event?.description?.match(/\(([^)]+)\)/)?.[1] || 'unknown',
          document_filename: p.document?.filename || 'no_document',
          timeline_id: p.timeline_event?.id,
          doc_id: p.document?.id,
          email_message_id: p.email_message_id,
        })),
        unmatched_documents: unmatchedDocs.map(d => ({
          doc_id: d.id,
          filename: d.filename,
          uploaded_at: d.uploaded_at,
        })),
      });
    }
    
    // Identify false merges
    const falseMerges = [];
    
    for (const candidate of report) {
      if (candidate.documents_count > 1) {
        // Extract names from filenames
        const filenames = candidate.documents.map(d => d.filename);
        const namesFromFiles = filenames.map(f => {
          // Extract name from filename like "קורות חיים של [שם].docx"
          const match = f.match(/של\s+(.+?)\.docx/);
          return match ? match[1].trim() : null;
        }).filter(Boolean);
        
        // Check if names are significantly different from candidate name
        const uniqueNames = [...new Set(namesFromFiles)];
        const candidateName = candidate.candidate_full_name;
        
        const differentNames = uniqueNames.filter(name => 
          name !== candidateName && 
          !name.includes(candidateName) && 
          !candidateName.includes(name)
        );
        
        if (differentNames.length > 0) {
          falseMerges.push({
            candidate_id: candidate.candidate_id,
            candidate_name: candidate.candidate_name,
            candidate_email: candidate.candidate_email,
            documents_count: candidate.documents_count,
            filenames: filenames,
            extracted_names_from_files: uniqueNames,
            different_names: differentNames,
            reason: `Multiple different names merged to single candidate: ${differentNames.join(', ')}`,
            severity: differentNames.length > 2 ? 'critical' : 'high',
          });
        }
      }
    }
    
    return Response.json({
      total_candidates: candidates.length,
      total_documents: documents.length,
      total_timeline_events: timeline.length,
      report: report,
      false_merges: falseMerges,
      summary: {
        candidates_with_multiple_docs: report.filter(c => c.documents_count > 1).length,
        candidates_with_review_required: report.filter(c => c.review_required).length,
        candidates_with_suspected_duplicate: report.filter(c => c.is_duplicate_suspected).length,
        false_merges_detected: falseMerges.length,
        critical_false_merges: falseMerges.filter(m => m.severity === 'critical').length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});