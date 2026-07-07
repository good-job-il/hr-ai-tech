import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CompensationService } from './compensation.service';
import {
  CreateCompensationPlanDto,
  UpdateCompensationPlanDto,
  QueryCompensationPlansDto,
} from './dto/compensation.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

@ApiTags('Compensation Plans')
@ApiBearerAuth()
@Controller('compensation-plans')
export class CompensationController {
  constructor(private readonly svc: CompensationService) {}

  @Get()
  findAll(@Query() q: QueryCompensationPlansDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.findById(id, u);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCompensationPlanDto, @CurrentUser() u: UserEntity) {
    return this.svc.create(dto, u);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompensationPlanDto, @CurrentUser() u: UserEntity) {
    return this.svc.update(id, dto, u);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.remove(id, u);
  }
}
