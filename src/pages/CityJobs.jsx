import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight, MapPin } from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import SEOHead from '@/components/SEOHead';

const CITIES = ['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה', 'באר שבע', 'רמת גן', 'הרצליה', 'כפר סבא', 'רעננה', 'מודיעין', 'חולון', 'בני ברק'];

export default function CityJobs() {
  const { city } = useParams();
  const decodedCity = decodeURIComponent(city);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['city-jobs', decodedCity],
    queryFn: async () => {
      const allJobs = await base44.entities.Job.list('-created_date', 500);
      return allJobs.filter(j => !j.is_closed && j.location?.includes(decodedCity));
    },
  });

  const seoTitle = `משרות ב${decodedCity} | דרושים ב${decodedCity} | HeadHunter`;
  const seoDesc = `${jobs.length} משרות פתוחות ב${decodedCity}. חפשו עבודה ב${decodedCity} בכל התחומים - היי-טק, שיווק, כספים, הנדסה ועוד. HeadHunter - פלטפורמת דרושים מובילה.`;
  const canonical = `https://headhunter.co.il/jobs/city/${encodeURIComponent(decodedCity)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#1a1f35] to-background" dir="rtl">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        keywords={`דרושים ${decodedCity}, משרות ${decodedCity}, עבודה ${decodedCity}, דרושים ב${decodedCity}`}
        schemaData={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "בית", "item": "https://headhunter.co.il/" },
            { "@type": "ListItem", "position": 2, "name": "משרות", "item": "https://headhunter.co.il/jobs" },
            { "@type": "ListItem", "position": 3, "name": `משרות ב${decodedCity}`, "item": canonical }
          ]
        }}
      />
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-cyan-300 transition-colors">בית</Link>
          <span>/</span>
          <Link to="/jobs" className="hover:text-cyan-300 transition-colors">משרות</Link>
          <span>/</span>
          <span className="text-cyan-300">ב{decodedCity}</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ background: 'linear-gradient(to right, #67e8f9, #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            משרות ב{decodedCity}
          </h1>
          <p className="text-gray-400 text-lg">{isLoading ? 'טוען...' : `${jobs.length} משרות פתוחות ב${decodedCity}`}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">לא נמצאו משרות ב{decodedCity} כרגע</p>
            <Link to="/jobs" className="mt-4 inline-block text-cyan-300 hover:text-purple-300">
              חפש בכל הארץ →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/15 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: job.company_color || '#6d28d9' }}>
                    {job.company_initials || job.company?.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="font-bold text-white group-hover:text-cyan-300 transition-colors text-lg leading-tight">{job.title}</h2>
                    <p className="text-cyan-300 text-sm mt-0.5">{job.company}</p>
                  </div>
                </div>
                {job.salary_min && job.salary_max && (
                  <div className="text-xl font-bold text-cyan-300 mb-3">
                    ₪{job.salary_min.toLocaleString('he-IL')} – ₪{job.salary_max.toLocaleString('he-IL')}
                  </div>
                )}
                <div className="text-sm text-gray-400 flex items-center gap-1 mt-auto">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Internal links to other cities */}
        <div className="mt-16 border-t border-white/10 pt-10">
          <h2 className="text-xl font-bold text-white mb-6">חפש משרות בערים נוספות</h2>
          <div className="flex flex-wrap gap-3">
            {CITIES.filter(c => c !== decodedCity).map(c => (
              <Link
                key={c}
                to={`/jobs/city/${encodeURIComponent(c)}`}
                className="px-4 py-2 bg-white/5 border border-white/15 rounded-lg text-gray-300 hover:text-cyan-300 hover:border-cyan-500/30 transition-all text-sm"
              >
                משרות ב{c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}