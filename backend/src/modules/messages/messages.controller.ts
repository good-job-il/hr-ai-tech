import { Controller, Get, Post, Patch, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, QueryMessagesDto } from './dto/messages.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}
  @Get() findAll(@Query() q: QueryMessagesDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateMessageDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMessageDto) { return this.svc.update(id, dto); }
  @Patch('read-all/:applicationId') markAllRead(@Param('applicationId', ParseUUIDPipe) id: string) { return this.svc.markAllRead(id); }
}

