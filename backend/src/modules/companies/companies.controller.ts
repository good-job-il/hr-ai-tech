import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompaniesDto, CreateCompanyReviewDto, CreateStaffDto, UpdateStaffDto } from './dto/companies.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

/** Agency users manage the tenant relationship through /agency-clients. */
const COMPANY_WRITE_ROLES = [UserRole.EMPLOYER, UserRole.ORG_ADMIN, UserRole.HR_MANAGER, UserRole.INTERNAL_RECRUITER, UserRole.ADMIN];

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  @Get() @Public() findAll(@Query() q: QueryCompaniesDto) { return this.svc.findAll(q); }
  @Get(':id') @Public() findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findById(id); }
  @Post() @Roles(UserRole.ADMIN) @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateCompanyDto) { return this.svc.create(dto); }
  @Patch(':id') @Roles(...COMPANY_WRITE_ROLES) update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompanyDto, @CurrentUser() u: UserEntity) { return this.svc.update(id, dto, u); }
  @Delete(':id') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: UserEntity) { return this.svc.softDelete(id, u); }

  // ─── Reviews ─────────────────────────────────────────────────────────────
  @Get(':id/reviews') @Public() getReviews(@Param('id', ParseIntPipe) id: number) { return this.svc.getReviews(id); }
  @Post(':id/reviews') @HttpCode(HttpStatus.CREATED) createReview(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCompanyReviewDto) { return this.svc.createReview({ ...dto, company_id: id }); }

  // ─── Staff ────────────────────────────────────────────────────────────────
  @Get(':id/staff') getStaff(@Param('id', ParseIntPipe) id: number) { return this.svc.getStaff(id); }
  @Post(':id/staff') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.CREATED) createStaff(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateStaffDto) { return this.svc.createStaff({ ...dto, company_id: String(id) }); }
  @Patch('staff/:id') @Roles(...COMPANY_WRITE_ROLES) updateStaff(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) { return this.svc.updateStaff(id, dto); }
  @Delete('staff/:id') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.NO_CONTENT) deleteStaff(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteStaff(id); }
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
  @Patch(':id') @Roles(...COMPANY_WRITE_ROLES) update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) { return this.svc.updateStaff(id, dto); }
  @Delete(':id') @Roles(...COMPANY_WRITE_ROLES) @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteStaff(id); }
}
