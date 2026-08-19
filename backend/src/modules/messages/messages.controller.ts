import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"
import { MessagesService } from "./messages.service"
import { CreateMessageDto, UpdateMessageDto, QueryMessagesDto } from "./dto/messages.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { UserEntity } from "../users/user.entity"

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("messages")
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}
  @Get() findAll(@Query() q: QueryMessagesDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u)
  }
  @Patch("read-all/:applicationId") markAllRead(
    @Param("applicationId", ParseIntPipe) id: number,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.markAllRead(id, u)
  }
  @Get(":id") findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.findById(id, u)
  }
  @Post() @HttpCode(HttpStatus.CREATED) create(
    @Body() dto: CreateMessageDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.create(dto, u)
  }
  @Patch(":id") update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.update(id, dto, u)
  }
}
