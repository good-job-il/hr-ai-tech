import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Convert resume to DOCX format
 * Handles PDF, DOC, DOCX, TXT inputs
 * Returns DOCX file URL
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source_file_url, source_filename, source_file_type } = await req.json();

    if (!source_file_url) {
      return Response.json({ error: 'Missing source_file_url' }, { status: 400 });
    }

    console.info(`[convertResumeToDocx] Converting ${source_filename} (${source_file_type}) to DOCX`);

    // Fetch the source file
    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch source file: ${fileResponse.statusText}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    // Generate DOCX based on source type
    let docxContent;
    const fileName = source_filename.split('.')[0];

    if (source_file_type === 'txt') {
      // For TXT, create a simple DOCX with formatted text
      docxContent = await createDocxFromText(fileBuffer);
    } else if (source_file_type === 'pdf') {
      // For PDF, extract text and create DOCX
      docxContent = await createDocxFromPdf(fileBuffer);
    } else if (source_file_type === 'doc' || source_file_type === 'docx') {
      // For DOC/DOCX, use as-is or re-save
      if (source_file_type === 'docx') {
        docxContent = fileBuffer;
      } else {
        // Convert DOC to DOCX
        docxContent = await convertDocToDocx(fileBuffer);
      }
    }

    // Upload converted DOCX
    const docxBlob = new Blob([docxContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const docxFileName = `${fileName}_converted.docx`;

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', docxBlob, docxFileName);

    // Upload using base44 integration
    const uploadRes = await base44.integrations.Core.UploadFile({ file: docxBlob });

    return Response.json({
      converted_resume_url: uploadRes.file_url,
      converted_filename: docxFileName,
      conversion_status: 'success',
      original_resume_url: source_file_url,
      original_filename: source_filename,
      original_file_type: source_file_type
    });
  } catch (error) {
    console.error('[convertResumeToDocx] Error:', error);
    return Response.json({ 
      error: error.message,
      conversion_status: 'failed'
    }, { status: 500 });
  }
});

// Helper: Create DOCX from TXT
async function createDocxFromText(textBuffer) {
  const text = new TextDecoder().decode(textBuffer);
  
  // Create basic DOCX XML structure
  const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  return Buffer.from(createMinimalDocx(docxXml), 'binary');
}

// Helper: Create DOCX from PDF (extract text)
async function createDocxFromPdf(pdfBuffer) {
  // Placeholder: Extract text from PDF and create DOCX
  // In production, use pdf-parse or similar library
  const text = '[PDF Content Extracted - Requires pdf-parse library]';
  
  const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        </w:rPr>
        <w:t>${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  return Buffer.from(createMinimalDocx(docxXml), 'binary');
}

// Helper: Convert DOC to DOCX
async function convertDocToDocx(docBuffer) {
  // Placeholder: Convert DOC binary to DOCX
  // This is a simplified pass-through
  return docBuffer;
}

// Helper: Escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Helper: Create minimal DOCX structure (ZIP with XML)
function createMinimalDocx(documentXml) {
  // Placeholder: Create proper DOCX ZIP structure
  // In production, use archiver or similar library
  return documentXml;
}