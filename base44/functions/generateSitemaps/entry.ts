import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_URL = 'https://headhunter.co.il';
const TODAY = new Date().toISOString().split('T')[0];

const CITIES = ['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה', 'באר שבע', 'רמת גן', 'הרצליה', 'כפר סבא', 'רעננה', 'מודיעין', 'חולון', 'בני ברק'];
const CATEGORIES = ['פיתוח תוכנה', 'עיצוב', 'שיווק', 'מכירות', 'כספים', 'HR', 'הנדסה', 'רפואה', 'חינוך', 'לוגיסטיקה', 'ניהול', 'משפטים', 'אדמיניסטרציה'];

function url(loc, lastmod, priority, changefreq = 'weekly') {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n    <changefreq>${changefreq}</changefreq>\n  </url>\n`;
}

function buildSitemap(urls) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('') + '</urlset>';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const jobs = await base44.asServiceRole.entities.Job.list('-created_date', 10000);
    const activeJobs = jobs.filter(j => !j.is_closed);
    const companies = await base44.asServiceRole.entities.Company.list('-created_date', 1000);

    // Main sitemap
    const mainUrls = [
      url(`${BASE_URL}/`, TODAY, '1.0', 'daily'),
      url(`${BASE_URL}/jobs`, TODAY, '0.95', 'daily'),
      url(`${BASE_URL}/companies`, TODAY, '0.8', 'weekly'),
      url(`${BASE_URL}/market-stats`, TODAY, '0.7', 'weekly'),
      // City pages
      ...CITIES.map(city => url(`${BASE_URL}/jobs/city/${encodeURIComponent(city)}`, TODAY, '0.85', 'daily')),
      // Category pages
      ...CATEGORIES.map(cat => url(`${BASE_URL}/jobs/category/${encodeURIComponent(cat)}`, TODAY, '0.85', 'daily')),
    ];

    // Jobs sitemap
    const jobUrls = activeJobs.slice(0, 50000).map(job => {
      const lastmod = job.updated_date?.split('T')[0] || TODAY;
      return url(`${BASE_URL}/jobs/${job.id}`, lastmod, '0.7', 'weekly');
    });

    // Companies sitemap
    const companyUrls = companies.map(company => {
      const lastmod = company.updated_date?.split('T')[0] || TODAY;
      return url(`${BASE_URL}/companies/${company.id}`, lastmod, '0.6', 'monthly');
    });

    // Sitemap index
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-jobs.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-companies.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
</sitemapindex>`;

    return Response.json({
      success: true,
      jobs_indexed: activeJobs.length,
      companies_indexed: companies.length,
      cities_indexed: CITIES.length,
      categories_indexed: CATEGORIES.length,
      sitemaps: {
        'sitemap-index.xml': sitemapIndex,
        'sitemap.xml': buildSitemap(mainUrls),
        'sitemap-jobs.xml': buildSitemap(jobUrls),
        'sitemap-companies.xml': buildSitemap(companyUrls),
      },
      message: 'Sitemaps generated successfully. Copy each sitemap content to the respective public/ file.'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});