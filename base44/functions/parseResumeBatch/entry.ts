import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Parse a batch of resume files from a ZIP upload
 * Extracts metadata and creates candidates with duplicate detection
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zip_file_url, import_batch_id, employer_id, recruiter_id, source, initial_status } = await req.json();

    if (!zip_file_url || !import_batch_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch ZIP file
    const zipResponse = await fetch(zip_file_url);
    const zipBuffer = await zipResponse.arrayBuffer();

    // Use JSZip to extract
    const JSZip = (await import('npm:jszip@3.10.1')).default;
    const zip = new JSZip();
    await zip.loadAsync(zipBuffer);

    const results = {
      total: 0,
      processed: 0,
      failed: 0,
      duplicates: [],
      candidates: [],
      errors: []
    };

    // Process each file
    const files = Object.keys(zip.files).filter(f => !f.endsWith('/'));

    for (const filename of files) {
      const ext = filename.split('.').pop().toLowerCase();
      
      // Support PDF, DOC, DOCX, TXT
      if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
        continue;
      }

      results.total++;

      try {
        const fileData = await zip.file(filename).async('base64');
        
        // Try to extract resume data with confidence scores
        const extractResult = await base44.functions.invoke('extractResumeFieldConfidence', {
          file_url: `data:application/${ext === 'pdf' ? 'pdf' : 'octet-stream'};base64,${fileData}`,
          filename: filename
        });

        // Convert to DOCX if not already
        let convertResult = { data: { converted_resume_url: null } };
        if (ext !== 'docx') {
          try {
            convertResult = await base44.functions.invoke('convertResumeToDocxProper', {
              source_file_url: `data:application/${ext === 'pdf' ? 'pdf' : 'octet-stream'};base64,${fileData}`,
              source_filename: filename,
              source_file_type: ext,
              extracted_text: extractResult.data?.parsed_text || ''
            });
          } catch (convErr) {
            console.warn(`[parseResumeBatch] DOCX conversion failed for ${filename}:`, convErr);
          }
        }

        if (!extractResult.data?.data) {
          results.failed++;
          results.errors.push({ filename, error: 'Failed to extract resume data' });
          continue;
        }

        // Format extracted data with confidence
        const extractedData = {
          full_name: extractResult.data.data.full_name?.value || '',
          phone: extractResult.data.data.phone?.value || '',
          email: extractResult.data.data.email?.value || '',
          location: extractResult.data.data.location?.value || '',
          role_name: extractResult.data.data.role_title?.value || '',
          summary: extractResult.data.data.summary?.value || '',
          skills: extractResult.data.data.skills?.value || [],
          experience_years: extractResult.data.data.experience_years?.value || 0,
          education: extractResult.data.data.education?.value || '',
          previous_companies: extractResult.data.data.previous_companies?.value || []
        };

        // Check for duplicates by email, phone, or name
        const duplicateCheck = await checkForDuplicates(
          base44,
          extractedData,
          employer_id || user.email
        );

        if (duplicateCheck.isDuplicate) {
          results.duplicates.push({
            filename,
            extracted: extractedData,
            existingCandidate: duplicateCheck.candidate,
            reason: duplicateCheck.reason
          });
          continue;
        }

        // All checks passed - add to candidates for creation
        const qualityScore = calculateQualityScore(extractedData);
        const fieldConfidences = extractResult.data.field_confidences || {};
        const overallConfidence = extractResult.data.overall_confidence || 0;
        
        results.candidates.push({
          filename,
          data: {
            ...extractedData,
            field_confidences: fieldConfidences,
            overall_parsing_confidence: overallConfidence,
            original_resume_url: null,
            converted_resume_url: convertResult.data?.converted_resume_url || null,
            converted_filename: convertResult.data?.converted_filename || '',
            original_file_type: ext,
            resume_uploaded_at: new Date().toISOString(),
            upload_source: 'import_zip',
            employer_id: employer_id || user.email,
            recruiter_id: recruiter_id || user.email,
            source: source || 'import',
            status: initial_status || 'new',
            import_batch_id,
            original_resume_filename: filename,
            data_quality_score: qualityScore,
            parsing_confidence: overallConfidence,
            review_required: qualityScore < 50 || overallConfidence < 60 || extractResult.data.missing_critical?.length > 0,
            missing_data: extractResult.data.missing_critical || getMissingFields(extractedData),
            parsing_status: overallConfidence > 80 ? 'success' : (overallConfidence > 50 ? 'partial' : 'failed')
          }
        });

        results.processed++;
      } catch (err) {
        results.failed++;
        results.errors.push({ filename, error: err.message });
      }
    }

    // Return summary (actual candidate creation happens in next step)
    return Response.json(results);
  } catch (error) {
    console.error('[parseResumeBatch] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkForDuplicates(base44, extractedData, employer_id) {
  try {
    // Use advanced duplicate detection
    const dupCheckResult = await base44.functions.invoke('detectDuplicateAdvanced', {
      full_name: extractedData.full_name,
      email: extractedData.email,
      phone: extractedData.phone,
      employer_id,
      parsed_text: extractedData.summary || '',
      resume_hash: extractedData.resume_hash || ''
    });

    if (dupCheckResult.data?.has_duplicates && dupCheckResult.data.highest_confidence >= 0.7) {
      return {
        isDuplicate: true,
        reason: dupCheckResult.data.duplicates[0]?.type || 'suspected_duplicate',
        confidence: dupCheckResult.data.highest_confidence,
        matches: dupCheckResult.data.duplicates
      };
    }

    return { isDuplicate: false };
  } catch (err) {
    console.warn('[checkForDuplicates] Error:', err);
    return { isDuplicate: false };
  }
}

function calculateQualityScore(data) {
  let score = 0;
  let maxScore = 9;

  if (data.full_name) score++;
  if (data.email) score++;
  if (data.phone) score++;
  if (data.location) score++;
  if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) score++;
  if (data.experience_years) score++;
  if (data.languages && Array.isArray(data.languages) && data.languages.length > 0) score++;
  if (data.previous_companies && Array.isArray(data.previous_companies) && data.previous_companies.length > 0) score++;
  if (data.summary) score++;

  return Math.round((score / maxScore) * 100);
}

function calculateConfidenceScores(data) {
  const scores = {
    full_name: data.full_name ? 0.9 : 0,
    email: data.email ? 0.95 : 0,
    phone: data.phone ? 0.9 : 0,
    location: data.location ? 0.8 : 0,
    skills: data.skills && Array.isArray(data.skills) && data.skills.length > 0 ? 0.85 : 0,
    experience_years: data.experience_years ? 0.9 : 0,
    languages: data.languages && Array.isArray(data.languages) && data.languages.length > 0 ? 0.8 : 0,
    previous_companies: data.previous_companies && Array.isArray(data.previous_companies) && data.previous_companies.length > 0 ? 0.85 : 0,
    summary: data.summary ? 0.75 : 0
  };

  const values = Object.values(scores).filter(s => s > 0);
  const overall = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) : 0;

  return { ...scores, overall };
}

function getMissingFields(data) {
  const required = ['full_name', 'email', 'phone', 'location', 'role_name'];
  const missing = [];

  for (const field of required) {
    if (!data[field]) {
      missing.push(field);
    }
  }

  return missing;
}