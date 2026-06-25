import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ allowed: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { entityName, action, recordId } = await req.json();

    // Admin can do anything
    if (user.user_type === 'admin') {
      return Response.json({ allowed: true, user });
    }

    const PERMISSIONS = {
      candidate: {
        read: ['SavedJob', 'Application', 'CandidateProfile', 'Message', 'Interview', 'JobAlert'],
        create: ['SavedJob', 'Application', 'CandidateProfile', 'Message', 'JobAlert'],
        delete: ['SavedJob', 'Application', 'JobAlert']
      },
      employer: {
        read: ['Job', 'Application', 'Message', 'Interview', 'ApplicationPipeline', 'Company'],
        create: ['Job', 'Message', 'Interview', 'ApplicationPipeline'],
        update: ['Job', 'Application', 'Message', 'Interview', 'ApplicationPipeline'],
        delete: ['Job', 'Application', 'Interview']
      },
      recruiter: {
        read: ['Job', 'Application', 'Message', 'Interview', 'ApplicationPipeline'],
        create: ['Job', 'Message', 'Interview', 'ApplicationPipeline'],
        update: ['Job', 'Application', 'Message', 'Interview'],
        delete: ['Job', 'Application', 'Interview']
      }
    };

    const userPermissions = PERMISSIONS[user.user_type];
    if (!userPermissions) {
      return Response.json({ allowed: false, error: 'Unknown user type' }, { status: 403 });
    }

    const allowed = userPermissions[action]?.includes(entityName);
    return Response.json({ allowed: allowed || false, user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});