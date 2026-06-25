import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { query = '', filters = {}, type = 'search', limit = 20 } = body;

    const base44 = createClientFromRequest(req);

    if (type === 'autocomplete') {
      // Return autocomplete suggestions including role aliases
      const allJobs = await base44.entities.Job.list('-created_date', 100);
      const roles = await base44.asServiceRole.entities.Role.list('-role_id', 500);
      const aliases = await base44.asServiceRole.entities.RoleAlias.list('-created_date', 500);
      const filtered = allJobs.filter(j => !j.is_closed);

      const suggestions = new Set();
      const queryLower = query.toLowerCase();

      // Add job titles and companies
      filtered.forEach(job => {
        if (job.title?.toLowerCase().startsWith(queryLower)) suggestions.add(job.title);
        if (job.company?.toLowerCase().startsWith(queryLower)) suggestions.add(job.company);
        if (job.category?.toLowerCase().includes(queryLower)) suggestions.add(job.category);
      });

      // Add matching roles
      roles.forEach(role => {
        if (role.name?.toLowerCase().startsWith(queryLower)) suggestions.add(role.name);
      });

      // Add matching aliases
      aliases.forEach(alias => {
        if (alias.alias?.toLowerCase().startsWith(queryLower)) suggestions.add(alias.alias);
      });

      return Response.json({
        suggestions: Array.from(suggestions).slice(0, 8),
        query
      });
    }

    if (type === 'recommendations') {
      // Return popular/recommended searches
      const allJobs = await base44.entities.Job.list('-views', 100);
      const categories = new Map();

      allJobs.forEach(job => {
        if (job.category) {
          categories.set(job.category, (categories.get(job.category) || 0) + 1);
        }
      });

      const recommendations = Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name]) => name);

      return Response.json({ recommendations });
    }

    // Main search with relevance scoring
    let allJobs = await base44.entities.Job.list('-created_date', 500);
    allJobs = allJobs.filter(j => !j.is_closed);

    const roles = await base44.asServiceRole.entities.Role.list('-role_id', 500);
    const aliases = await base44.asServiceRole.entities.RoleAlias.list('-created_date', 500);
    const domains = await base44.asServiceRole.entities.Domain.list('-domain_id', 500);

    const queryLower = query.toLowerCase().trim();

    // Resolve query to canonical role if it's an alias
    let resolvedRoleId = null;
    if (queryLower) {
      const matchingAlias = aliases.find(a => a.alias.toLowerCase() === queryLower);
      if (matchingAlias) {
        const canonicalRole = roles.find(r => r.name === matchingAlias.canonical_role);
        if (canonicalRole) {
          resolvedRoleId = canonicalRole.role_id;
        }
      }
      // Check if query is a direct role name
      if (!resolvedRoleId) {
        const matchingRole = roles.find(r => r.name.toLowerCase() === queryLower);
        if (matchingRole) {
          resolvedRoleId = matchingRole.role_id;
        }
      }
    }

    // Calculate relevance score for each job
    const jobsWithScore = allJobs.map(job => {
      let score = 0;

      if (!queryLower) {
        score = (job.views || 0) + 10; // Default: sort by views
      } else {
        // 1. Exact title match - highest priority
        if (job.title?.toLowerCase() === queryLower) {
          score += 1000;
        }
        // 2. Title starts with query
        else if (job.title?.toLowerCase().startsWith(queryLower)) {
          score += 500;
        }
        // 3. Role ID match (from alias or role name)
        else if (resolvedRoleId && job.role_id === resolvedRoleId) {
          score += 400;
        }
        // 4. Role name/alias partial match
        else if (job.role_id) {
          const role = roles.find(r => r.role_id === job.role_id);
          if (role && role.name.toLowerCase().includes(queryLower)) {
            score += 200;
          }
        }
        // 5. Domain match
        else if (job.domain_id) {
          const domain = domains.find(d => d.domain_id === job.domain_id);
          if (domain && domain.name.toLowerCase().includes(queryLower)) {
            score += 150;
          }
        }
        // 6. Title includes query text
        else if (job.title?.toLowerCase().includes(queryLower)) {
          score += 100;
        }
        // 7. Company match
        else if (job.company?.toLowerCase().includes(queryLower)) {
          score += 75;
        }
        // 8. Category match
        else if (job.category?.toLowerCase().includes(queryLower)) {
          score += 50;
        }

        // Bonus: Recent posts
        const daysOld = (Date.now() - new Date(job.created_date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) score += 20;
        else if (daysOld < 30) score += 10;

        // Bonus: Views
        score += (job.views || 0) * 0.05;

        // Bonus: Applications
        score += (job.applications_count || 0) * 0.1;
      }

      return { ...job, relevanceScore: score };
    });

    // Apply filters
    let filtered = jobsWithScore;

    if (filters.type?.length > 0) {
      filtered = filtered.filter(job => filters.type.includes(job.type));
    }
    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.category?.length > 0) {
      filtered = filtered.filter(job => filters.category.includes(job.category));
    }
    if (filters.salary_min || filters.salary_max) {
      filtered = filtered.filter(job => {
        const min = filters.salary_min || 0;
        const max = filters.salary_max || Infinity;
        const jobMin = job.salary_min || 0;
        const jobMax = job.salary_max || Infinity;
        return jobMax >= min && jobMin <= max;
      });
    }

    // Sort by relevance
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return Response.json({
      jobs: filtered.slice(0, limit).map(({ relevanceScore, ...job }) => job),
      total: filtered.length,
      query
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});