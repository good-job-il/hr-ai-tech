import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import crypto from 'npm:crypto';

/**
 * Advanced duplicate detection using:
 * - Email/Phone exact match
 * - Name similarity
 * - Resume content hash
 * - Parsed text similarity
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = user.organization_id || user.data?.organization_id;
    if (!organizationId) {
      return Response.json({ error: 'Organization context required' }, { status: 403 });
    }

    const {
      full_name,
      email,
      phone,
      employer_id,
      parsed_text,
      resume_hash
    } = await req.json();

    // Fetch existing candidates for this employer
    const candidates = await base44.entities.Candidate.filter(
      { organization_id: organizationId, employer_id },
      '-created_date',
      10000
    );

    const duplicates = [];

    for (const candidate of candidates) {
      const match = checkDuplicate(
        { full_name, email, phone, parsed_text, resume_hash },
        candidate
      );

      if (match.isDuplicate) {
        duplicates.push({
          ...match,
          existing_candidate: {
            id: candidate.id,
            full_name: candidate.full_name,
            email: candidate.email,
            phone: candidate.phone,
            created_date: candidate.created_date
          }
        });
      }
    }

    // Sort by confidence descending
    duplicates.sort((a, b) => b.confidence - a.confidence);

    return Response.json({
      duplicates,
      has_duplicates: duplicates.length > 0,
      highest_confidence: duplicates[0]?.confidence || 0
    });
  } catch (error) {
    console.error('[detectDuplicateAdvanced] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function checkDuplicate(newCandidate, existingCandidate) {
  const checks = [];

  // 1. Email exact match (highest confidence)
  if (newCandidate.email && existingCandidate.email) {
    if (newCandidate.email.toLowerCase().trim() === existingCandidate.email.toLowerCase().trim()) {
      checks.push({
        type: 'email_match',
        confidence: 0.99,
        reason: 'דוקא מייל'
      });
    }
  }

  // 2. Phone exact match
  if (newCandidate.phone && existingCandidate.phone) {
    const newPhone = normalizePhone(newCandidate.phone);
    const existingPhone = normalizePhone(existingCandidate.phone);
    if (newPhone && newPhone === existingPhone) {
      checks.push({
        type: 'phone_match',
        confidence: 0.98,
        reason: 'תואם טלפון'
      });
    }
  }

  // 3. Name similarity (using Levenshtein)
  if (newCandidate.full_name && existingCandidate.full_name) {
    const similarity = levenshteinSimilarity(
      newCandidate.full_name.toLowerCase().trim(),
      existingCandidate.full_name.toLowerCase().trim()
    );
    if (similarity > 0.85) {
      checks.push({
        type: 'name_similarity',
        confidence: 0.7 + (similarity * 0.2),
        reason: `דמיון שם: ${(similarity * 100).toFixed(0)}%`
      });
    }
  }

  // 4. Resume content hash
  if (newCandidate.resume_hash && existingCandidate.resume_hash) {
    if (newCandidate.resume_hash === existingCandidate.resume_hash) {
      checks.push({
        type: 'resume_hash_match',
        confidence: 0.95,
        reason: 'קורות חיים זהות'
      });
    }
  }

  // 5. Parsed text similarity
  if (newCandidate.parsed_text && existingCandidate.parsed_text) {
    const textSimilarity = calcTextSimilarity(
      newCandidate.parsed_text,
      existingCandidate.parsed_text
    );
    if (textSimilarity > 0.8) {
      checks.push({
        type: 'parsed_text_similarity',
        confidence: 0.65 + (textSimilarity * 0.25),
        reason: `דמיון טקסט: ${(textSimilarity * 100).toFixed(0)}%`
      });
    }
  }

  if (checks.length === 0) {
    return { isDuplicate: false };
  }

  // Return highest confidence match
  const bestMatch = checks.reduce((a, b) => a.confidence > b.confidence ? a : b);

  return {
    isDuplicate: bestMatch.confidence >= 0.7,
    confidence: bestMatch.confidence,
    type: bestMatch.type,
    reason: bestMatch.reason,
    all_matches: checks
  };
}

function normalizePhone(phone) {
  if (!phone) return '';
  // Remove all non-digits
  return phone.replace(/\D/g, '');
}

function levenshteinSimilarity(a, b) {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - (distance / maxLength);
}

function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[b.length][a.length];
}

function calcTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}
