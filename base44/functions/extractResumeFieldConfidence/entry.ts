import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Extract resume fields with confidence scores
 * Each field returns value + confidence (0-100)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, filename } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Extract with detailed confidence
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `קרא את קובץ קורות החיים וחלץ את המידע הבא בעברית.
      עבור כל שדה, החזר גם רמת ביטחון (0-100) בהתאם לוודאות הנתון.
      
      אם לא מוצא נתון - השאר ריק ותן confidence 0.
      אל תהמציא מידע.
      
      {
        "full_name": {"value": "שם מלא", "confidence": 95},
        "phone": {"value": "טלפון", "confidence": 90},
        "email": {"value": "אימייל", "confidence": 98},
        "location": {"value": "עיר", "confidence": 70},
        "role_title": {"value": "תפקיד", "confidence": 75},
        "summary": {"value": "תקציר", "confidence": 60},
        "skills": {"value": ["skill1", "skill2"], "confidence": 65},
        "experience_years": {"value": 5, "confidence": 70},
        "education": {"value": "השכלה", "confidence": 75},
        "previous_companies": {"value": ["חברה1"], "confidence": 60}
      }`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          full_name: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
          phone: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
          email: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
          location: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
          role_title: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
          summary: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
          skills: { type: 'object', properties: { value: { type: 'array' }, confidence: { type: 'number' } } },
          experience_years: { type: 'object', properties: { value: { type: 'number' }, confidence: { type: 'number' } } },
          education: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
          previous_companies: { type: 'object', properties: { value: { type: 'array' }, confidence: { type: 'number' } } }
        }
      }
    });

    // Calculate overall confidence and identify missing critical fields
    const fieldConfidences = {};
    const missingCritical = [];
    let totalConfidence = 0;
    let fieldCount = 0;

    const criticalFields = ['full_name', 'email', 'phone'];

    for (const [field, data] of Object.entries(extractionResult)) {
      if (data && typeof data === 'object' && 'confidence' in data) {
        fieldConfidences[field] = data.confidence;
        totalConfidence += data.confidence;
        fieldCount++;

        if (criticalFields.includes(field) && (!data.value || data.confidence < 50)) {
          missingCritical.push(field);
        }
      }
    }

    const overallConfidence = fieldCount > 0 ? Math.round(totalConfidence / fieldCount) : 0;

    return Response.json({
      success: true,
      data: {
        ...extractionResult,
        overall_confidence: overallConfidence,
        field_confidences: fieldConfidences,
        missing_critical: missingCritical,
        requires_review: overallConfidence < 60 || missingCritical.length > 0
      }
    });

  } catch (error) {
    console.error('[extractResumeFieldConfidence] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});