import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { companyEmail, company_culture, benefits, gallery_urls, video_url } = await req.json();

    if (companyEmail !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.auth.updateMe({
      company_culture,
      benefits,
      gallery_urls: gallery_urls || [],
      video_url
    });

    return Response.json({ success: true, message: 'Company profile updated' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});