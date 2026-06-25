/**
 * debugGmailSearch — one-off QA tool
 * Searches Gmail inbox for recent messages and returns their IDs + headers.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Search for messages in last 1 hour
    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=to:r.rodion2802%2BhhLADG4%40gmail.com&maxResults=10`,
      { headers: authHeader }
    );
    const searchData = await searchRes.json();
    const messageIds = (searchData.messages || []).map(m => m.id);

    if (!messageIds.length) {
      return Response.json({ found: 0, note: 'No messages matching subject:QA+CV+Test' });
    }

    // Fetch headers for each
    const details = [];
    for (const id of messageIds.slice(0, 5)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: authHeader }
      );
      const msg = await msgRes.json();
      const headers = msg.payload?.headers || [];
      const getH = name => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      // Recursively collect all parts
      const collectParts = (payload) => {
        const result = [];
        if (!payload) return result;
        if (payload.filename || payload.mimeType) {
          result.push({ mimeType: payload.mimeType, filename: payload.filename || '', size: payload.body?.size || 0 });
        }
        for (const p of (payload.parts || [])) result.push(...collectParts(p));
        return result;
      };
      const allParts = collectParts(msg.payload);
      const attachments = allParts.filter(p => p.filename && p.filename.length > 0);

      details.push({
        id,
        from: getH('From'),
        to: getH('To'),
        subject: getH('Subject'),
        date: getH('Date'),
        labelIds: msg.labelIds,
        hasAttachment: attachments.length > 0,
        attachments,
        allParts,
      });
    }

    return Response.json({ found: details.length, messages: details });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});