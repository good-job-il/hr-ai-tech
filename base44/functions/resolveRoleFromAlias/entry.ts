import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { roleNameOrAlias } = body;

    if (!roleNameOrAlias) {
      return Response.json({ error: 'roleNameOrAlias is required' }, { status: 400 });
    }

    // Load aliases
    const aliases = await base44.asServiceRole.entities.RoleAlias.list('-created_date', 1000);
    const normalized = roleNameOrAlias.toLowerCase().trim();

    // Check if it's an alias
    const aliasMatch = aliases.find(
      a => a.alias.toLowerCase() === normalized
    );
    const canonicalName = aliasMatch?.canonical_role || roleNameOrAlias;

    // Load roles
    const roles = await base44.asServiceRole.entities.Role.list('-role_id', 1000);
    const role = roles.find(r => r.name === canonicalName);

    if (!role) {
      return Response.json({
        success: false,
        inputAlias: roleNameOrAlias,
        canonicalName,
        resolvedRole: null,
        message: `Role "${canonicalName}" not found in system`,
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      inputAlias: roleNameOrAlias,
      canonicalName,
      resolvedRole: {
        id: role.id,
        role_id: role.role_id,
        name: role.name,
        domain_id: role.domain_id,
        domain_name: role.domain_name,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});