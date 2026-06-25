import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all jobs
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 1000);

    // Fetch import sources for company info lookup
    const importSources = await base44.asServiceRole.entities.ImportSource.list('-created_date', 100);
    
    const updates = [];

    for (const job of allJobs) {
      let updatedDescription = job.description || '';
      let hasChanges = false;

      // 1. If company info is missing, fetch from import source
      let companyInfo = '';
      if (!job.description?.toLowerCase().includes('חברה') && importSources.length > 0) {
        // Try to fetch company info from the source website
        const source = importSources.find(s => job.company?.toLowerCase().includes(s.name?.toLowerCase() || ''));
        if (source?.url) {
          try {
            const pageResponse = await fetch(source.url).catch(() => null);
            if (pageResponse?.ok) {
              const text = await pageResponse.text();
              // Extract company mention (simplified)
              const companyMatch = text.match(new RegExp(`${job.company}.*?(?:<|$)`, 'i'));
              if (companyMatch) {
                companyInfo = `\n\nעל החברה:\n${job.company} היא חברה המעסיקה כישרונות בתחום ${job.category || 'ההייטק'}.`;
                hasChanges = true;
              }
            }
          } catch (err) {
            // Silently fail - continue without fetched info
          }
        }
      }

      // 2. Extract or generate requirements if missing
      let requirementsSection = '';
      const hasRequirements = updatedDescription.toLowerCase().includes('דרישות') || 
                              updatedDescription.toLowerCase().includes('דורש') ||
                              updatedDescription.toLowerCase().includes('required');
      
      if (!hasRequirements) {
        // Generate requirements based on category and description
        const requirements = generateRequirements(job.category, job.title, updatedDescription);
        requirementsSection = `\n\nדרישות:\n${requirements}`;
        hasChanges = true;
      }

      // 3. Reformat description if needed
      if (hasChanges) {
        let formattedDescription = updatedDescription;
        
        // Add company info at the beginning if fetched
        if (companyInfo && !formattedDescription.toLowerCase().includes('על החברה')) {
          formattedDescription = companyInfo + '\n\n' + formattedDescription;
        }

        // Add requirements section if generated
        if (requirementsSection && !hasRequirements) {
          formattedDescription = formattedDescription + requirementsSection;
        }

        // Add equal opportunity statement at the end
        if (!formattedDescription.includes('המשרה פונה לנשים ולגברים')) {
          formattedDescription = formattedDescription + '\n\n*המשרה פונה לנשים ולגברים כאחד.';
        }

        updates.push({
          id: job.id,
          description: formattedDescription
        });
      } else if (!updatedDescription.includes('המשרה פונה לנשים ולגברים')) {
        // Add equal opportunity statement even if no other changes
        updates.push({
          id: job.id,
          description: updatedDescription + '\n\n*המשרה פונה לנשים ולגברים כאחד.'
        });
      }
    }

    // Update all jobs with new descriptions
    for (const update of updates) {
      await base44.asServiceRole.entities.Job.update(update.id, {
        description: update.description
      }).catch(() => {});
    }

    return Response.json({ 
      message: `Updated ${updates.length} job descriptions`,
      count: updates.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateRequirements(category, title, description) {
  const categoryRequirements = {
    'הנדסה': 'תואר ראשון במדעי המחשב או תחום קשור\nניסיון של 2+ שנים בפיתוח\nיכולת עבודה בצוות\nאנגלית ברמה טובה',
    'מכירות': 'ניסיון בתפקיד מכירות\nיכולת משכנע גבוהה\nידע בתחום המוצר\nצלילות ויכולת ניהול זמן',
    'שיווק': 'ניסיון בתחום השיווק דיגיטלי או בעולי\nידע בכלים אנליטיים\nכישורי כתיבה וקריאייטיביות\nידע בסוציאל מדיה',
    'הנהלה': 'ניסיון בתפקידי הנהלה\nיכולת ניהול משאבים\nתואר במנהל עסקים או כלכלה\nנסיון בעבודה עם צוותים',
    'דיזיין': 'תיק עבודות משמעותי\nשליטה בתוכנות עיצוב (Figma, Adobe)\nכישורים גבוהים של creativity\nניסיון ב-UI/UX',
    'default': 'ניסיון בתחום הרלוונטי\nיכולת עבודה בצוות\nגמישות ויכולת למידה\nתקשורת טובה'
  };

  let baseRequirements = categoryRequirements[category] || categoryRequirements['default'];
  
  // Enhance based on title keywords
  if (title.toLowerCase().includes('בכיר') || title.toLowerCase().includes('senior')) {
    baseRequirements += '\nניסיון של 5+ שנים בתחום\nיכולת מנהיגות וקבלת החלטות';
  }
  
  if (title.toLowerCase().includes('ניהול') || title.toLowerCase().includes('manager')) {
    baseRequirements += '\nניסיון בניהול צוותים\nיכולות ניהול וקשר בינאישי';
  }

  return baseRequirements;
}