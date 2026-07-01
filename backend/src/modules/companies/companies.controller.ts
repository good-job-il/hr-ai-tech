import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompaniesDto, CreateCompanyReviewDto, CreateStaffDto, UpdateStaffDto } from './dto/companies.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserEntity } from '../users/user.entity';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  @Get() @Public() findAll(@Query() q: QueryCompaniesDto) { return this.svc.findAll(q); }
  @Get(':id') @Public() findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateCompanyDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto, @CurrentUser() u: UserEntity) { return this.svc.update(id, dto, u); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: UserEntity) { return this.svc.softDelete(id, u); }

  // ─── Reviews ─────────────────────────────────────────────────────────────
  @Get(':id/reviews') @Public() getReviews(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getReviews(id); }
  @Post(':id/reviews') @HttpCode(HttpStatus.CREATED) createReview(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateCompanyReviewDto) { return this.svc.createReview({ ...dto, company_id: id }); }

  // ─── Staff ────────────────────────────────────────────────────────────────
  @Get(':id/staff') getStaff(@Param('id') id: string) { return this.svc.getStaff(id); }
  @Post(':id/staff') @HttpCode(HttpStatus.CREATED) createStaff(@Param('id') id: string, @Body() dto: CreateStaffDto) { return this.svc.createStaff({ ...dto, company_id: id }); }
  @Patch('staff/:id') updateStaff(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) { return this.svc.updateStaff(id, dto); }
  @Delete('staff/:id') @HttpCode(HttpStatus.NO_CONTENT) deleteStaff(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteStaff(id); }
}

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly svc: CompaniesService) {}

  @Get() findAll(@Query('organization_id') organizationId?: string, @Query('company_id') companyId?: string) {
    return this.svc.findAllStaff({ organization_id: organizationId, company_id: companyId });
  }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateStaffDto) { return this.svc.createStaff(dto); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) { return this.svc.updateStaff(id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteStaff(id); }
}

