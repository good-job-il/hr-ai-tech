/**
 * auditDuplicateDetection
 * Debug function to audit duplicate detection logic for last 20 pool emails
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Fetch last 30 messages to get all 11 CVs
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30`,
      { headers: authHeader }
    );
    const list = await listRes.json();
    
    const poolMessages = [];
    
    // Filter only pool messages with attachments
    for (const msg of list.messages || []) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: authHeader }
      );
      const message = await msgRes.json();
      
      const headers = message.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      const toHeader = getHeader('To');
      const aliasMatch = toHeader.match(/\+([a-zA-Z0-9]+)@/);
      const alias = aliasMatch ? aliasMatch[1] : null;
      
      // Only pool messages with attachments
      if (alias === 'pool' && message.payload?.parts?.some(p => p.filename)) {
        poolMessages.push({
          messageId: msg.id,
          threadId: message.threadId,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: toHeader,
          date: getHeader('Date'),
          hasAttachment: true,
        });
      }
    }

    console.log(`[audit] Found ${poolMessages.length} pool messages with attachments`);

    // Now fetch all Candidates and Documents
    const allCandidates = await base44.asServiceRole.entities.Candidate.list('-created_date', 500);
    const allDocuments = await base44.asServiceRole.entities.CandidateDocument.list('-uploaded_at', 500);
    const allTimeline = await base44.asServiceRole.entities.CandidateTimeline.list('-created_date', 500);

    // Build audit report
    const auditReport = [];

    for (const msg of poolMessages) {
      // Find timeline events for this message
      const timelineEvents = allTimeline.filter(t => 
        t.metadata?.email_message_id === msg.messageId
      );

      // Find documents uploaded around this time
      const msgDate = new Date(msg.date);
      const documents = allDocuments.filter(d => {
        const docDate = new Date(d.uploaded_at);
        return Math.abs(docDate.getTime() - msgDate.getTime()) < 120000; // Within 2 minutes
      });

      // Find candidates created/updated around this time
      const candidates = allCandidates.filter(c => {
        const cDate = new Date(c.created_date);
        const uDate = new Date(c.updated_date);
        return Math.abs(cDate.getTime() - msgDate.getTime()) < 120000 || 
               Math.abs(uDate.getTime() - msgDate.getTime()) < 120000;
      });

      // Extract duplicate info from timeline
      const timelineEvent = timelineEvents.find(t => t.event_type === 'imported');
      const isDuplicate = timelineEvent?.metadata?.is_duplicate || false;
      const duplicateReason = timelineEvent?.metadata?.duplicate_reason || null;

      auditReport.push({
        gmail_message_id: msg.messageId,
        gmail_thread_id: msg.threadId,
        subject: msg.subject,
        from: msg.from,
        received_at: msg.date,
        filename: documents[0]?.filename || documents[0]?.original_filename || 'unknown',
        candidate_id: candidates[0]?.id || timelineEvent?.candidate_id || 'unknown',
        candidate_name: candidates[0]?.full_name || 'unknown',
        candidate_email: candidates[0]?.email || 'unknown',
        candidate_phone: candidates[0]?.phone || 'unknown',
        created_new_candidate: candidates[0]?.created_date && Math.abs(new Date(candidates[0].created_date).getTime() - msgDate.getTime()) < 120000,
        updated_existing_candidate: !candidates[0]?.created_date || Math.abs(new Date(candidates[0].updated_date).getTime() - msgDate.getTime()) < Math.abs(new Date(candidates[0].created_date).getTime() - msgDate.getTime()),
        is_duplicate: isDuplicate,
        duplicate_reason: duplicateReason,
        timeline_event_id: timelineEvent?.id || 'none',
        document_id: documents[0]?.id || 'none',
      });
    }

    // Analyze false merges
    const candidateGroups = {};
    for (const item of auditReport) {
      if (!candidateGroups[item.candidate_id]) {
        candidateGroups[item.candidate_id] = [];
      }
      candidateGroups[item.candidate_id].push(item);
    }

    const suspiciousMerges = [];
    for (const [candidateId, items] of Object.entries(candidateGroups)) {
      if (items.length > 1) {
        const filenames = items.map(i => i.filename).filter((f, i, a) => a.indexOf(f) === i);
        if (filenames.length > 1) {
          suspiciousMerges.push({
            candidate_id: candidateId,
            candidate_name: items[0].candidate_name,
            candidate_email: items[0].candidate_email,
            candidate_phone: items[0].candidate_phone,
            cv_count: items.length,
            filenames: filenames,
            reason: 'Multiple different CVs merged to same candidate'
          });
        }
      }
    }

    return Response.json({
      total_pool_messages: poolMessages.length,
      audit_report: auditReport,
      suspicious_merges: suspiciousMerges,
      analysis: {
        total_candidates_found: Object.keys(candidateGroups).length,
        candidates_with_multiple_cvs: suspiciousMerges.length,
        duplicate_rate: auditReport.filter(i => i.is_duplicate).length / auditReport.length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});