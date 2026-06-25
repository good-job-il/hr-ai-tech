import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PopularCategories() {
  const [showAll, setShowAll] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ['all-jobs-for-popular'],
    queryFn: async () => {
      const allJobs = await base44.entities.Job.list('-created_date', 1000);
      return allJobs.filter(j => !j.is_closed);
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['all-companies-for-popular'],
    queryFn: () => base44.entities.Company.list('-created_date', 1000),
  });

  // Calculate dynamic counts
  const dailyCount = jobs.filter(j => j.type === 'daily').length;
  const remoteCount = jobs.filter(j => j.type === 'remote').length;
  const partCount = jobs.filter(j => j.type === 'part').length;
  const companyCount = companies.length;

  const getCategoryCount = (keyword) => {
    return jobs.filter(j => j.title?.toLowerCase().includes(keyword.toLowerCase())).length;
  };

  const CATEGORIES = [
    { title: 'משרות יום', salary: 'עד ₪25,000', count: `${dailyCount} משרות`, link: '/jobs?type=daily' },
    { title: 'חברות', count: `${companyCount} חברות`, link: '/companies' },
    { title: 'עבודה מהבית', count: `${remoteCount} משרות`, link: '/jobs?type=remote' },
    { title: 'עבודה חלקית', salary: 'עד ₪35,000', count: `${partCount} משרות`, link: '/jobs?type=part' },
    { title: 'שליח', salary: '₪8,000 – ₪18,000', count: `${getCategoryCount('שליח')} משרות`, link: '/jobs?q=שליח' },
    { title: 'נהג', salary: '₪10,000 – ₪22,000', count: `${getCategoryCount('נהג')} משרות`, link: '/jobs?q=נהג' },
    { title: 'מוכר/ת', salary: '₪8,000 – ₪16,000', count: `${getCategoryCount('מוכר')} משרות`, link: '/jobs?q=מוכר' },
    { title: 'קופאי/ת', salary: '₪8,000 – ₪14,000', count: `${getCategoryCount('קופאי')} משרות`, link: '/jobs?q=קופאי' },
    { title: 'מנהל/ת', salary: 'עד ₪40,000', count: `${getCategoryCount('מנהל')} משרות`, link: '/jobs?q=מנהל' },
    { title: 'מפתח/ת תוכנה', salary: '₪15,000 – ₪50,000', count: `${getCategoryCount('מפתח')} משרות`, link: '/jobs?q=מפתח' },
    { title: 'שיווק', salary: 'עד ₪30,000', count: `${getCategoryCount('שיווק')} משרות`, link: '/jobs?q=שיווק' },
    { title: 'מנהל/ת חשבונות', salary: '₪10,000 – ₪25,000', count: `${getCategoryCount('חשבונות')} משרות`, link: '/jobs?q=חשבונות' },
    { title: 'מהנדס/ת', salary: '₪15,000 – ₪40,000', count: `${getCategoryCount('מהנדס')} משרות`, link: '/jobs?q=מהנדס' },
    { title: 'עו"ד', salary: '₪10,000 – ₪50,000', count: `${getCategoryCount('עורך דין')} משרות`, link: '/jobs?q=עורך דין' },
    { title: 'מעצב/ת', salary: 'עד ₪28,000', count: `${getCategoryCount('מעצב')} משרות`, link: '/jobs?q=מעצב' },
    { title: 'אחות/אח', salary: '₪12,000 – ₪30,000', count: `${getCategoryCount('אחות')} משרות`, link: '/jobs?q=אחות' },
  ];

  const visible = showAll ? CATEGORIES : CATEGORIES.slice(0, 16);

  return (
    <div className="bg-blue-50/50">
      <div className="max-w-[1200px] mx-auto px-4 py-12" dir="rtl">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3 text-gray-900">
          <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
          תחומים פופולריים
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {visible.map((cat, i) => (
            <Link
              key={i}
              to={cat.link}
              className="bg-white border border-blue-100 rounded-lg p-5 hover:border-blue-300 hover:shadow-md hover:bg-blue-50 transition-all group"
            >
              <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-base leading-snug">
                {cat.title}
              </div>
              {cat.salary && (
                <div className="text-xs text-gray-600 mt-2 font-medium">{cat.salary}</div>
              )}
              <div className="text-xs text-gray-500 mt-2">{cat.count}</div>
            </Link>
          ))}
        </div>
        {!showAll && CATEGORIES.length > 16 && (
          <button
            onClick={() => setShowAll(true)}
            className="text-blue-600 text-sm mt-8 hover:text-blue-700 transition-colors font-semibold inline-flex items-center gap-1 active:scale-95"
          >
            ראה את כל התחומים
            <span>←</span>
          </button>
        )}
      </div>
    </div>
  );
}