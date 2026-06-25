/**
 * debugEmailHeaders
 * Debug function to inspect ALL email headers for alias detection
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Fetch last 20 messages
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20`,
      { headers: authHeader }
    );
    const list = await listRes.json();
    
    const results = [];

    for (const msg of list.messages || []) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: authHeader }
      );
      const message = await msgRes.json();
      
      const headers = message.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const toHeader = getHeader('To');
      const deliveredTo = getHeader('Delivered-To');
      const xForwardedTo = getHeader('X-Forwarded-To');
      const returnPath = getHeader('Return-Path');
      const envelopeTo = getHeader('Envelope-To');
      const fromHeader = getHeader('From');
      const subject = getHeader('Subject');
      const date = getHeader('Date');
      
      // Extract all aliases
      const aliasMatch = toHeader.match(/\+([a-zA-Z0-9]+)@/);
      const deliveredAliasMatch = deliveredTo?.match(/\+([a-zA-Z0-9]+)@/);
      
      results.push({
        messageId: msg.id,
        threadId: message.threadId,
        from: fromHeader,
        to: toHeader,
        'Delivered-To': deliveredTo,
        'X-Forwarded-To': xForwardedTo,
        'Return-Path': returnPath,
        'Envelope-To': envelopeTo,
        subject,
        date,
        parsedAlias_fromTo: aliasMatch ? aliasMatch[1] : null,
        parsedAlias_fromDeliveredTo: deliveredAliasMatch ? deliveredAliasMatch[1] : null,
        hasAttachment: message.payload?.parts?.some(p => p.filename) || false,
        labels: message.labelIds,
      });
    }

    return Response.json({
      totalMessages: results.length,
      messages: results,
      analysis: {
        messagesWithPoolAlias: results.filter(r => r.parsedAlias_fromTo === 'pool' || r.parsedAlias_fromDeliveredTo === 'pool').length,
        messagesWithJobAlias: results.filter(r => r.parsedAlias_fromTo && r.parsedAlias_fromTo !== 'pool').length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});