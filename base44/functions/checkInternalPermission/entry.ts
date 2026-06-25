/**
 * checkInternalPermission
 * Permission checks for internal recruitment team pilot
 * Roles: admin, recruitment_manager, team_manager, recruiter
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ allowed: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, resource, recordId } = await req.json();

    // Internal recruitment team roles
    const INTERNAL_ROLES = ['admin', 'recruitment_manager', 'team_manager', 'recruiter'];
    
    if (!INTERNAL_ROLES.includes(user.role)) {
      return Response.json({ 
        allowed: false, 
        error: 'Access denied: Internal recruitment access only',
        user_role: user.role 
      }, { status: 403 });
    }

    // Admin has full access
    if (user.role === 'admin') {
      return Response.json({ allowed: true, user });
    }

    // Define permissions for internal team
    const PERMISSIONS = {
      // Candidate operations
      candidate: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        create: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        update: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        delete: ['admin', 'recruitment_manager'],
      },
      // Application operations
      application: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        create: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        update: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        delete: ['admin', 'recruitment_manager'],
      },
      // Job operations
      job: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        create: ['admin', 'recruitment_manager', 'team_manager'],
        update: ['admin', 'recruitment_manager', 'team_manager'],
        delete: ['admin', 'recruitment_manager'],
      },
      // Import operations
      import: {
        create: ['admin', 'recruitment_manager', 'team_manager'],
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
      },
      // Pool operations (general candidate pool)
      pool: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        create: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
      },
      // Send to employer
      send_to_employer: {
        execute: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
      },
      // Assign to job
      assign_to_job: {
        execute: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
      },
      // Pipeline operations
      pipeline: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        update: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
      },
      // Document operations
      document: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        upload: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        delete: ['admin', 'recruitment_manager', 'team_manager'],
      },
      // Note operations
      note: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        create: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        update: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        delete: ['admin', 'recruitment_manager', 'team_manager'],
      },
      // Interview operations
      interview: {
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        create: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        update: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        delete: ['admin', 'recruitment_manager', 'team_manager'],
      },
      // WhatsApp / Communication
      communication: {
        send: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
        read: ['admin', 'recruitment_manager', 'team_manager', 'recruiter'],
      },
    };

    // Check permission
    const resourcePermissions = PERMISSIONS[resource];
    if (!resourcePermissions) {
      // Unknown resource - deny by default
      return Response.json({ 
        allowed: false, 
        error: `Unknown resource: ${resource}`,
        user_role: user.role 
      }, { status: 403 });
    }

    const allowedRoles = resourcePermissions[action];
    if (!allowedRoles) {
      return Response.json({ 
        allowed: false, 
        error: `Unknown action: ${action} on ${resource}`,
        user_role: user.role 
      }, { status: 403 });
    }

    const allowed = allowedRoles.includes(user.role);
    
    return Response.json({ 
      allowed: allowed, 
      user: {
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});