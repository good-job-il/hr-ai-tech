/**
 * separateFalseMerges
 * Separates falsely merged candidates by creating new candidates for each unique name
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all pool candidates with multiple documents
    const candidates = await base44.asServiceRole.entities.Candidate.filter({ source: 'pool' }, '-created_date', 50);
    const documents = await base44.asServiceRole.entities.CandidateDocument.list('-uploaded_at', 100);
    const timeline = await base44.asServiceRole.entities.CandidateTimeline.list('-created_date', 200);
    
    const separationResults = [];
    let newCandidatesCreated = 0;
    
    for (const candidate of candidates) {
      const candidateDocs = documents.filter(d => d.candidate_id === candidate.id);
      
      if (candidateDocs.length <= 1) continue; // Skip candidates with only 1 document
      
      // Extract names from filenames
      const namesFromFiles = candidateDocs.map(d => {
        const match = d.filename.match(/של\s+(.+?)\.docx/);
        return match ? match[1].trim() : null;
      }).filter(Boolean);
      
      const uniqueNames = [...new Set(namesFromFiles)];
      const candidateName = candidate.full_name;
      
      // Check if names are significantly different
      const differentNames = uniqueNames.filter(name => 
        name !== candidateName && 
        !name.includes(candidateName) && 
        !candidateName.includes(name)
      );
      
      if (differentNames.length === 0) continue; // No false merge detected
      
      console.log(`[separateFalseMerges] False merge detected for candidate ${candidate.id} (${candidateName})`);
      console.log(`  Different names found: ${differentNames.join(', ')}`);
      
      // Group documents by extracted name
      const nameToDocs = {};
      for (const doc of candidateDocs) {
        const match = doc.filename.match(/של\s+(.+?)\.docx/);
        const name = match ? match[1].trim() : 'unknown';
        if (!nameToDocs[name]) {
          nameToDocs[name] = [];
        }
        nameToDocs[name].push(doc);
      }
      
      // For each different name, create a new candidate
      for (const [name, docs] of Object.entries(nameToDocs)) {
        if (name === candidateName) continue; // Skip the original candidate's documents
        
        console.log(`  Creating new candidate for: ${name} (${docs.length} documents)`);
        
        // Use the first document to extract data
        const primaryDoc = docs[0];
        
        try {
          // Re-extract data from CV for this specific name
          const extractRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `קרא את קורות החיים המצורפים וחלץ את כל הנתונים הבאים בעברית.
            חשוב מאוד: אם השם בקובץ שונה מהשם בקורות החיים עצמם, ציין זאת.
            
            חלץ:
            - full_name (שם מלא מקורות החיים)
            - email
            - phone
            - location
            - skills
            - experience_years
            - summary
            - domain_name
            - role_name
            - desired_salary_min
            - desired_salary_max
            - languages
            - previous_companies
            
            אם אין מידע — השאר null או מערך ריק.`,
            file_urls: [primaryDoc.file_url],
            response_json_schema: {
              type: 'object',
              properties: {
                full_name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                location: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } },
                experience_years: { type: 'number' },
                summary: { type: 'string' },
                domain_name: { type: 'string' },
                role_name: { type: 'string' },
                desired_salary_min: { type: 'number' },
                desired_salary_max: { type: 'number' },
                languages: { type: 'array', items: { type: 'string' } },
                previous_companies: { type: 'array', items: { type: 'string' } },
              }
            }
          });
          
          // Create new candidate
          const newCandidate = await base44.asServiceRole.entities.Candidate.create({
            full_name: extractRes.full_name || name, // Use filename name as fallback
            email: extractRes.email || '',
            phone: extractRes.phone || '',
            location: extractRes.location || '',
            skills: extractRes.skills || [],
            experience_years: extractRes.experience_years || 0,
            summary: extractRes.summary || '',
            domain_name: extractRes.domain_name || null,
            role_name: extractRes.role_name || null,
            desired_salary_min: extractRes.desired_salary_min || null,
            desired_salary_max: extractRes.desired_salary_max || null,
            languages: extractRes.languages || [],
            previous_companies: extractRes.previous_companies || [],
            resume_url: primaryDoc.file_url,
            resume_filename: primaryDoc.filename,
            original_file_type: primaryDoc.original_file_type,
            source: 'pool',
            status: 'new',
            parsing_status: 'success',
            is_duplicate_suspected: true,
            review_required: true,
            duplicate_of_id: candidate.id, // Link to original candidate for review
          });
          
          console.log(`  Created new candidate: ${newCandidate.id} for ${name}`);
          
          // Update document to point to new candidate
          for (const doc of docs) {
            await base44.asServiceRole.entities.CandidateDocument.update(doc.id, {
              candidate_id: newCandidate.id,
              candidate_email: newCandidate.email,
            });
          }
          
          // Create timeline event
          await base44.asServiceRole.entities.CandidateTimeline.create({
            candidate_id: newCandidate.id,
            candidate_email: newCandidate.email,
            event_type: 'registered',
            description: `מועמד הופרד ממיזוג שגוי - קודם שויך בטעות ל${candidateName}`,
            performed_by: 'system',
            performed_by_name: 'מערכת הפרדת מיזוגים',
            performed_by_role: 'system',
            metadata: {
              separated_from_candidate_id: candidate.id,
              separated_from_candidate_name: candidateName,
              reason: 'false_merge_detected',
              filename_names: uniqueNames,
            },
            is_visible_to_candidate: false,
            is_visible_to_employer: false,
          });
          
          newCandidatesCreated++;
          
          separationResults.push({
            original_candidate_id: candidate.id,
            original_candidate_name: candidateName,
            new_candidate_id: newCandidate.id,
            new_candidate_name: newCandidate.full_name,
            name_from_filename: name,
            documents_count: docs.length,
            documents: docs.map(d => d.filename),
          });
          
        } catch (err) {
          console.error(`  Failed to create candidate for ${name}:`, err.message);
          separationResults.push({
            original_candidate_id: candidate.id,
            original_candidate_name: candidateName,
            name_from_filename: name,
            documents_count: docs.length,
            error: err.message,
          });
        }
      }
    }
    
    return Response.json({
      total_false_merges_fixed: separationResults.length,
      new_candidates_created: newCandidatesCreated,
      results: separationResults,
      summary: {
        candidates_processed: candidates.length,
        false_merges_detected: separationResults.filter(r => r.new_candidate_id).length,
        errors: separationResults.filter(r => r.error).length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});