import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto, UpdateInterviewDto, QueryInterviewsDto } from './dto/interviews.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly svc: InterviewsService) {}

  @Get() findAll(@Query() q: QueryInterviewsDto, @CurrentUser() u: UserEntity) { return this.svc.findAll(q, u); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateInterviewDto, @CurrentUser() u: UserEntity) { return this.svc.create(dto, u); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInterviewDto) { return this.svc.update(id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}

