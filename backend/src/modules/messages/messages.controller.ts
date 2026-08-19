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
  UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"
import { MessagesService } from "./messages.service"
import { CreateMessageDto, UpdateMessageDto, QueryMessagesDto } from "./dto/messages.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { UserEntity } from "../users/user.entity"
import { AgencyActionPolicyGuard } from "../permissions/agency-action-policy.guard"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("messages")
@UseGuards(AgencyActionPolicyGuard)
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}
  @Get() findAll(@Query() q: QueryMessagesDto, @CurrentUser() u: UserEntity) {
    return this.svc.findAll(q, u)
  }
  @Patch("read-all/:applicationId") @RequiresPermission("update") markAllRead(
    @Param("applicationId", ParseIntPipe) id: number,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.markAllRead(id, u)
  }
  @Get(":id") findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() u: UserEntity) {
    return this.svc.findById(id, u)
  }
  @Post() @RequiresPermission("update") @HttpCode(HttpStatus.CREATED) create(
    @Body() dto: CreateMessageDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.create(dto, u)
  }
  @Patch(":id") @RequiresPermission("update") update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() u: UserEntity,
  ) {
    return this.svc.update(id, dto, u)
  }
}
