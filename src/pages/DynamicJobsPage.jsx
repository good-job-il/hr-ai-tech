import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { generateSEOMetadata, generateJobPostingSchema, generateBreadcrumbSchema } from '@/lib/seoGenerator';
import Jobs from './Jobs';
import SEOHead from '@/components/SEOHead';

// Dynamic page handler for:
// /jobs/domain/:domainId
// /jobs/role/:roleId
// /jobs/city/:city
// /jobs/city/:city/role/:roleName

export default function DynamicJobsPage() {
  const params = useParams();
  const { domainId, roleId, city, roleNamePath } = params;

  // Fetch domain if needed
  const { data: domain } = useQuery({
    queryKey: ['domain', domainId],
    queryFn: () => domainId ? base44.entities.Domain.get(domainId) : null,
    enabled: !!domainId,
  });

  // Fetch role if needed
  const { data: role } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => roleId ? base44.entities.Role.get(roleId) : null,
    enabled: !!roleId,
  });

  // Fetch jobs for current filter
  const { data: jobs = [] } = useQuery({
    queryKey: ['dynamic-jobs', { domainId, roleId, city }],
    queryFn: async () => {
      const query = {};
      if (domainId) query.domain_id = parseInt(domainId);
      if (roleId) query.role_id = parseInt(roleId);
      if (city && city !== 'all') query.location = city;
      
      const results = await base44.entities.Job.filter(query, '-updated_date', 100);
      return results.filter(j => !j.is_closed);
    },
  });

  // Generate SEO based on page type
  let seoData, pageTitle, breadcrumbs;

  if (domainId && domain) {
    seoData = generateSEOMetadata('domain', {
      id: domainId,
      name: domain.name,
      jobCount: jobs.length,
    });
    pageTitle = `משרות ${domain.name}`;
    breadcrumbs = [
      { name: 'בית', url: '/' },
      { name: 'משרות', url: '/jobs' },
      { name: domain.name, url: `/jobs/domain/${domainId}` },
    ];
  } else if (roleId && role) {
    seoData = generateSEOMetadata('role', {
      id: roleId,
      name: role.name,
      jobCount: jobs.length,
    });
    pageTitle = `משרות ${role.name}`;
    breadcrumbs = [
      { name: 'בית', url: '/' },
      { name: 'משרות', url: '/jobs' },
      { name: role.domain_name, url: `/jobs/domain/${role.domain_id}` },
      { name: role.name, url: `/jobs/role/${roleId}` },
    ];
  } else if (city) {
    seoData = generateSEOMetadata('city', {
      city,
      jobCount: jobs.length,
    });
    pageTitle = `משרות ב${city}`;
    breadcrumbs = [
      { name: 'בית', url: '/' },
      { name: 'משרות', url: '/jobs' },
      { name: city, url: `/jobs/city/${city}` },
    ];
  } else {
    seoData = {
      title: 'משרות | HeadHunter',
      description: 'ברוור המשרות הפתוחות ביותר בישראל',
    };
    pageTitle = 'משרות';
  }

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        canonical={seoData.canonical}
        schemaData={breadcrumbs ? generateBreadcrumbSchema(breadcrumbs) : null}
      />

      {/* Pass filters to Jobs component */}
      <Jobs 
        initialDomainId={domainId}
        initialRoleId={roleId}
        initialCity={city}
        pageTitle={pageTitle}
      />
    </>
  );
}