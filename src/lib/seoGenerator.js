// SEO Metadata Generator for Dynamic Pages
export function generateSEOMetadata(pageType, data) {
  const baseUrl = "https://headhunter.co.il"

  switch (pageType) {
    case "domain":
      return {
        title: `משרות ${data.name} | HeadHunter`,
        description: `ברוור את משרות ${data.name} הפתוחות. ${data.jobCount} משרות זמינות עבור ${data.name}`,
        canonical: `${baseUrl}/jobs/domain/${data.id}`,
        ogTitle: `משרות ${data.name}`,
        ogDescription: `${data.jobCount} משרות ${data.name}`,
        ogUrl: `${baseUrl}/jobs/domain/${data.id}`,
      }

    case "role":
      return {
        title: `משרות ${data.name} | HeadHunter`,
        description: `חיפוש משרות ${data.name}. ${data.jobCount} משרות פתוחות. הצטרפו לחברות מובילות`,
        canonical: `${baseUrl}/jobs/role/${data.id}`,
        ogTitle: `משרות ${data.name}`,
        ogDescription: `משרות ${data.name} - ${data.jobCount} הצעות עבודה`,
        ogUrl: `${baseUrl}/jobs/role/${data.id}`,
      }

    case "city":
      return {
        title: `משרות ב${data.city} | HeadHunter`,
        description: `משרות פתוחות ב${data.city}. ${data.jobCount} משרות, חברות טובות, שכר תחרותי`,
        canonical: `${baseUrl}/jobs/city/${data.city}`,
        ogTitle: `משרות ב${data.city}`,
        ogDescription: `${data.jobCount} משרות ב${data.city}`,
        ogUrl: `${baseUrl}/jobs/city/${data.city}`,
      }

    case "city-role":
      return {
        title: `משרות ${data.role} ב${data.city} | HeadHunter`,
        description: `משרות ${data.role} ב${data.city}. ${data.jobCount} הצעות, שכר מעודכן, קבוצות מובילות`,
        canonical: `${baseUrl}/jobs/${data.city}/${data.role}`,
        ogTitle: `${data.role} ב${data.city}`,
        ogDescription: `${data.jobCount} משרות ${data.role} ב${data.city}`,
        ogUrl: `${baseUrl}/jobs/${data.city}/${data.role}`,
      }

    default:
      return {}
  }
}

// Generate JobPosting structured data
export function generateJobPostingSchema(job) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || "",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.company_color && { logo: generateLogoUrl(job.company_initials, job.company_color) }),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "IL",
      },
    },
    employmentType: mapEmploymentType(job.type),
    validThrough: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    datePosted: job.created_date,
  }

  // Add salary if exists
  if (job.salary_min && job.salary_max) {
    schema.baseSalary = {
      "@type": "PriceSpecification",
      priceCurrency: "ILS",
      price: `${job.salary_min}-${job.salary_max}`,
    }
  }

  return schema
}

function mapEmploymentType(type) {
  const map = {
    full: "FULL_TIME",
    part: "PART_TIME",
    daily: "TEMPORARY",
    remote: "FULL_TIME",
  }

  return map[type] || "FULL_TIME"
}

function generateLogoUrl(initials, color) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='50' font-size='40' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='central'%3E${initials}%3C/text%3E%3C/svg%3E`
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
