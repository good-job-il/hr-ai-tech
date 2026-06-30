import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TaxonomyService } from './taxonomy.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Taxonomy')
@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly service: TaxonomyService) {}

  /** Load entire taxonomy in one request — mirrors base44.functions.invoke('loadTaxonomy') */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Load all taxonomy data (domains, roles, specializations, etc.)' })
  loadAll() {
    return this.service.loadAll();
  }

  @Public()
  @Get('domains')
  @ApiOperation({ summary: 'List all domains' })
  getDomains() {
    return this.service.getDomains();
  }

  @Public()
  @Get('domains/:id')
  @ApiOperation({ summary: 'Get domain by ID' })
  getDomain(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDomain(id);
  }

  @Public()
  @Get('roles')
  @ApiOperation({ summary: 'List roles, optionally filtered by domain_id' })
  @ApiQuery({ name: 'domain_id', required: false, type: Number })
  getRoles(@Query('domain_id') domainId?: string) {
    return this.service.getRoles(domainId ? parseInt(domainId, 10) : undefined);
  }

  @Public()
  @Get('specializations')
  @ApiOperation({ summary: 'List specializations, optionally filtered by role_name' })
  @ApiQuery({ name: 'role_name', required: false, type: String })
  getSpecializations(@Query('role_name') roleName?: string) {
    return this.service.getSpecializations(roleName);
  }

  @Public()
  @Get('work-modes')
  @ApiOperation({ summary: 'List work modes' })
  getWorkModes() {
    return this.service.getWorkModes();
  }

  @Public()
  @Get('employment-types')
  @ApiOperation({ summary: 'List employment types' })
  getEmploymentTypes() {
    return this.service.getEmploymentTypes();
  }

  @Public()
  @Get('experience-levels')
  @ApiOperation({ summary: 'List experience levels' })
  getExperienceLevels() {
    return this.service.getExperienceLevels();
  }
}

