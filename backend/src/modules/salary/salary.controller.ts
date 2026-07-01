import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { CreateSalaryDataDto, UpdateSalaryDataDto, QuerySalaryDataDto } from './dto/salary-data.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Salary Data')
@Controller('salary-data')
export class SalaryController {
  constructor(private readonly svc: SalaryService) {}

  @Get() @Public() findAll(@Query() q: QuerySalaryDataDto) { return this.svc.findAll(q); }
  @Get(':id') @Public() findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }

  @Post() @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSalaryDataDto) { return this.svc.create(dto); }

  @Patch(':id') @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSalaryDataDto) { return this.svc.update(id, dto); }

  @Delete(':id') @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN) @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}

