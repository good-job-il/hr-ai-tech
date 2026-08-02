import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { authService } from '@/api/services/authService';
import { Search, MapPin, Briefcase, Lock, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmployerLayout from '@/components/employer/EmployerLayout';
import CandidateFilters from '@/components/employer/CandidateFilters';

const typeLabels = { full: 'מלאה', part: 'חלקית', remote: 'מרחוק', any: 'כל הסוגים' };

export default function CandidateSearch() {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});

  const { data: userEmail } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const user = await authService.me();
      return user?.email;
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['employer-applications', userEmail],
    queryFn: () => base44.entities.Application.filter({ employer_id: userEmail }),
    enabled: !!userEmail,
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['candidate-profiles'],
    queryFn: () => base44.entities.CandidateProfile.filter({ is_public: true }),
  });

  // Only show profiles for candidates who applied to this employer
  const applicantEmails = new Set(applications.map(a => a.candidate_email));

  const filtered = profiles.filter(p => {
    const isApplicant = applicantEmails.has(p.user_email);
    if (!isApplicant) return false;

    const q = search.toLowerCase();
    const matchSearch = !search || p.title?.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q) ||
      (p.skills || []).some(s => s.toLowerCase().includes(q));
    const matchLocation = !locationFilter || p.location?.includes(locationFilter);

    // Experience filter
    if (filters.experience?.length > 0) {
      const years = p.experience_years || 0;
      const matchExperience = filters.experience.some(exp => {
        if (exp === '0') return years === 0;
        if (exp === '1-3') return years >= 1 && years <= 3;
        if (exp === '3-5') return years > 3 && years <= 5;
        if (exp === '5+') return years > 5;
        return false;
      });
      if (!matchExperience) return false;
    }

    // Job type filter
    if (filters.jobType?.length > 0) {
      if (!filters.jobType.includes(p.job_type)) return false;
    }

    // Salary range filter
    if (filters.salaryRange?.length > 0) {
      const salary = p.desired_salary_min || 0;
      const matchSalary = filters.salaryRange.some(range => {
        if (range === '0-15000') return salary <= 15000;
        if (range === '15000-25000') return salary > 15000 && salary <= 25000;
        if (range === '25000-40000') return salary > 25000 && salary <= 40000;
        if (range === '40000+') return salary > 40000;
        return false;
      });
      if (!matchSalary) return false;
    }

    return matchSearch && matchLocation;
  });

  return (
    <EmployerLayout>
      <div className="p-6" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">חיפוש מועמדים</h1>
          <Button
            onClick={() => setShowFilters(true)}
            variant="outline"
            className="border-gray-300 gap-2"
          >
            <Sliders className="w-4 h-4" />
            סינון
          </Button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center border border-gray-200 rounded-lg px-3 gap-2 bg-white h-10">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי תפקיד, כישור..."
              className="flex-1 text-sm outline-none bg-transparent" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 gap-2 bg-white h-10">
            <MapPin className="w-4 h-4 text-gray-400" />
            <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="מיקום..."
              className="text-sm outline-none w-28 bg-transparent" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-hhblue rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">לא נמצאו מועמדים</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-hhblue/10 text-hhblue flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {p.full_name?.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{p.full_name}</div>
                    <div className="text-xs text-hhblue mt-0.5">{p.title}</div>
                  </div>
                </div>

                {p.summary && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{p.summary}</p>}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(p.skills || []).slice(0, 4).map((s, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {(p.skills || []).length > 4 && <span className="text-xs text-gray-400">+{p.skills.length - 4}</span>}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  {p.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</div>}
                  {p.experience_years > 0 && <div className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{p.experience_years} שנות ניסיון</div>}
                  {p.desired_salary_min && <div>שכר: ₪{p.desired_salary_min.toLocaleString()}+</div>}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <Lock className="w-3 h-3" />
                    <span>פרטים זמינים למעסיקים בתשלום בעתיד</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CandidateFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFilterChange={setFilters}
        />
      </div>
    </EmployerLayout>
  );
}
