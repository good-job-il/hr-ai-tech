import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, file_content_base64 } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Calculate hash of resume for duplicate detection
    let resumeHash = '';
    try {
      if (file_content_base64) {
        const encoder = new TextEncoder();
        const data = encoder.encode(file_content_base64);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        resumeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (hashErr) {
      console.warn('[extractAndTranslateResume] Hash calculation failed:', hashErr);
    }

    // Extract data from resume using LLM
    const extractionPrompt = `
    קרא את קובץ קורות החיים וחלץ את המידע הבא.

    כללי חילוץ קריטיים:
    1. full_name - השם מהכותרת/ראש קורות החיים
    2. email - האימייל מפרטי הקשר בראש קורות החיים בלבד
    3. phone - הטלפון מפרטי הקשר בראש קורות החיים בלבד
    4. location - העיר הנוכחית
    5. title - התפקיד מניסיון העבודה האחרון/הנוכחי (המשרה הראשונה ברשימת הניסיון), לא קורסים
    6. skills - כישורים מניסיון העבודה בפועל (כלים, תוכנות, מתודולוגיות שבהן השתמש/ה בעבודה בפועל). אל תכלול כישורים שנלמדו בקורסים בלבד
    7. experience_years - חשב לפי תאריכי העסקה בניסיון העבודה (סה"כ שנות עבודה)
    8. summary - 2-3 שורות על הניסיון המקצועי העיקרי
    9. education - השכלה
    10. original_language - en/he/other

    אם הטקסט בעברית - השתמש בעברית.
    אם הטקסט באנגלית - תרגם שם, תפקיד, סיכום לעברית.
    `;

    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: extractionPrompt,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          location: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          experience_years: { type: 'number' },
          education: { type: 'string' },
          original_language: { type: 'string' }
        }
      }
    });

    // Get parsed text for similarity comparison
    const fullText = [
      extractionResult.full_name,
      extractionResult.title,
      extractionResult.summary,
      (extractionResult.skills || []).join(' '),
      extractionResult.education
    ].filter(Boolean).join(' ');

    return Response.json({
      success: true,
      data: {
        ...extractionResult,
        resume_hash: resumeHash,
        parsed_text: fullText,
        extraction_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});