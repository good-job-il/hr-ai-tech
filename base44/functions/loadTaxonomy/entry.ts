import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Download the taxonomy file from the URL - VERIFY THIS IS THE LATEST FILE
    const fileUrl = 'https://media.base44.com/files/public/6a00f4b05ae5180d66425437/186689370_.xlsx';
    
    // Log file info for verification
    console.log(`[loadTaxonomy] Loading taxonomy from: ${fileUrl}`);
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // Extract data from sheets
    const domains = XLSX.utils.sheet_to_json(workbook.Sheets['תחומים']);
    const roles = XLSX.utils.sheet_to_json(workbook.Sheets['תפקידים']);
    const specializations = XLSX.utils.sheet_to_json(workbook.Sheets['התמחויות']);
    const aliases = XLSX.utils.sheet_to_json(workbook.Sheets['מילים נרדפות']);
    const employmentTypes = XLSX.utils.sheet_to_json(workbook.Sheets['סוגי העסקה']);
    const workModes = XLSX.utils.sheet_to_json(workbook.Sheets['אופן עבודה']);
    const experienceLevels = XLSX.utils.sheet_to_json(workbook.Sheets['רמות ניסיון']);

    // Validate and prepare data
    const errors = [];

    // Check domains
    if (domains.length === 0) {
      errors.push('Sheet "תחומים" is empty');
    }

    // Check roles
    if (roles.length === 0) {
      errors.push('Sheet "תפקידים" is empty');
    }

    // Check for missing domain_ids in roles
    const roleMissingDomain = roles.filter(r => !r.domain_id);
    if (roleMissingDomain.length > 0) {
      errors.push(`${roleMissingDomain.length} roles missing domain_id`);
    }

    // Check for missing role_names in specializations
    const specMissingRole = specializations.filter(s => !s.role_name);
    if (specMissingRole.length > 0) {
      errors.push(`${specMissingRole.length} specializations missing role_name`);
    }

    // Check for missing aliases
    const aliasMissing = aliases.filter(a => !a.alias || !a.canonical_role);
    if (aliasMissing.length > 0) {
      errors.push(`${aliasMissing.length} aliases missing alias or canonical_role`);
    }

    if (errors.length > 0) {
      return Response.json({
        success: false,
        message: 'Validation errors in file',
        errors,
        stats: {
          domains: domains.length,
          roles: roles.length,
          specializations: specializations.length,
          aliases: aliases.length,
          employmentTypes: employmentTypes.length,
          workModes: workModes.length,
          experienceLevels: experienceLevels.length,
        },
      }, { status: 400 });
    }

    // Load domains
    const existingDomains = await base44.asServiceRole.entities.Domain.list('-domain_id', 1000);
    let domainsCreated = 0;
    for (const domain of domains) {
      const exists = existingDomains.find(d => d.domain_id === domain.domain_id);
      if (!exists) {
        await base44.asServiceRole.entities.Domain.create({
          domain_id: domain.domain_id,
          name: domain.תחום,
        });
        domainsCreated++;
      }
    }

    // Load roles
    const existingRoles = await base44.asServiceRole.entities.Role.list('-role_id', 1000);
    let rolesCreated = 0;
    for (const role of roles) {
      const exists = existingRoles.find(r => r.role_id === role.role_id);
      if (!exists) {
        await base44.asServiceRole.entities.Role.create({
          role_id: role.role_id,
          domain_id: role.domain_id,
          domain_name: role.תחום,
          name: role.תפקיד,
        });
        rolesCreated++;
      }
    }

    // Load specializations
    const existingSpecs = await base44.asServiceRole.entities.Specialization.list('-specialization_id', 1000);
    let specsCreated = 0;
    for (const spec of specializations) {
      const exists = existingSpecs.find(s => s.specialization_id === spec.specialization_id);
      if (!exists) {
        await base44.asServiceRole.entities.Specialization.create({
          specialization_id: spec.specialization_id,
          role_name: spec.role_name,
          name: spec.התמחות,
        });
        specsCreated++;
      }
    }

    // Load aliases
    const existingAliases = await base44.asServiceRole.entities.RoleAlias.list('-created_date', 1000);
    let aliasesCreated = 0;
    for (const alias of aliases) {
      const exists = existingAliases.find(a => a.alias.toLowerCase() === alias.alias.toLowerCase());
      if (!exists) {
        await base44.asServiceRole.entities.RoleAlias.create({
          alias: alias.alias,
          canonical_role: alias.canonical_role,
        });
        aliasesCreated++;
      }
    }

    // Load employment types
    const existingEmploymentTypes = await base44.asServiceRole.entities.EmploymentType.list('-type_id', 1000);
    let employmentTypesCreated = 0;
    for (const et of employmentTypes) {
      const exists = existingEmploymentTypes.find(e => e.type_id === et.id);
      if (!exists) {
        await base44.asServiceRole.entities.EmploymentType.create({
          type_id: et.id,
          name: et['סוג העסקה'],
        });
        employmentTypesCreated++;
      }
    }

    // Load work modes
    const existingWorkModes = await base44.asServiceRole.entities.WorkMode.list('-mode_id', 1000);
    let workModesCreated = 0;
    for (const wm of workModes) {
      const exists = existingWorkModes.find(w => w.mode_id === wm.id);
      if (!exists) {
        await base44.asServiceRole.entities.WorkMode.create({
          mode_id: wm.id,
          name: wm['אופן עבודה'],
        });
        workModesCreated++;
      }
    }

    // Load experience levels
    const existingLevels = await base44.asServiceRole.entities.ExperienceLevel.list('-level_id', 1000);
    let levelsCreated = 0;
    for (const level of experienceLevels) {
      const exists = existingLevels.find(l => l.level_id === level.id);
      if (!exists) {
        await base44.asServiceRole.entities.ExperienceLevel.create({
          level_id: level.id,
          name: level['רמת ניסיון'],
        });
        levelsCreated++;
      }
    }

    return Response.json({
      success: true,
      message: 'Taxonomy loaded from file successfully',
      stats: {
        domains: { total: domains.length, created: domainsCreated },
        roles: { total: roles.length, created: rolesCreated },
        specializations: { total: specializations.length, created: specsCreated },
        aliases: { total: aliases.length, created: aliasesCreated },
        employmentTypes: { total: employmentTypes.length, created: employmentTypesCreated },
        workModes: { total: workModes.length, created: workModesCreated },
        experienceLevels: { total: experienceLevels.length, created: levelsCreated },
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});