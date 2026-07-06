import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompaniesDto, CreateCompanyReviewDto, CreateStaffDto, UpdateStaffDto } from './dto/companies.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ORG_ROLES } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

/** Company profile is managed by the employer's own staff or agency/admin staff */
const COMPANY_WRITE_ROLES = [UserRole.EMPLOYER, ...ORG_ROLES, UserRole.ADMIN];

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  @Get() @Public() findAll(@Query() q: QueryCompaniesDto) { return this.svc.findAll(q); }
  @Get(':id') @Public() findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Post() @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateCompanyDto) { return this.svc.create(dto); }
  @Patch(':id') @Roles(...COMPANY_WRITE_ROLES) update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto, @CurrentUser() u: UserEntity) { return this.svc.update(id, dto, u); }
  @Delete(':id') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: UserEntity) { return this.svc.softDelete(id, u); }

  // ─── Reviews ─────────────────────────────────────────────────────────────
  @Get(':id/reviews') @Public() getReviews(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getReviews(id); }
  @Post(':id/reviews') @HttpCode(HttpStatus.CREATED) createReview(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateCompanyReviewDto) { return this.svc.createReview({ ...dto, company_id: id }); }

  // ─── Staff ────────────────────────────────────────────────────────────────
  @Get(':id/staff') getStaff(@Param('id') id: string) { return this.svc.getStaff(id); }
  @Post(':id/staff') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.CREATED) createStaff(@Param('id') id: string, @Body() dto: CreateStaffDto) { return this.svc.createStaff({ ...dto, company_id: id }); }
  @Patch('staff/:id') @Roles(...COMPANY_WRITE_ROLES) updateStaff(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) { return this.svc.updateStaff(id, dto); }
  @Delete('staff/:id') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.NO_CONTENT) deleteStaff(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteStaff(id); }
}

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly svc: CompaniesService) {}

  @Get() findAll(@Query('organization_id') organizationId?: string, @Query('company_id') companyId?: string) {
    return this.svc.findAllStaff({ organization_id: organizationId, company_id: companyId });
  }
  @Post() @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateStaffDto) { return this.svc.createStaff(dto); }
  @Patch(':id') @Roles(...COMPANY_WRITE_ROLES) update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) { return this.svc.updateStaff(id, dto); }
  @Delete(':id') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteStaff(id); }
}

