import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { OrganizationsService } from "./organizations.service"
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  QueryOrganizationsDto,
  OnboardAgencyDto,
} from "./dto/organizations.dto"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { BlockDuringImpersonation } from "@/common/decorators/block-during-impersonation.decorator"
import { UserEntity } from "../users/user.entity"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"
import { EffectivePermissionsGuard } from "../permissions/effective-permissions.guard"

@ApiTags("Organizations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: "List organizations" })
  findAll(@Query() query: QueryOrganizationsDto, @CurrentUser() user: UserEntity) {
    return this.service.findAll(query, user)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get organization by ID" })
  findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.findById(id, user)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @BlockDuringImpersonation()
  @ApiOperation({ summary: "Create organization (admin only)" })
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: UserEntity) {
    return this.service.create(dto, user)
  }

  @Post("onboard-agency")
  @HttpCode(HttpStatus.CREATED)
  @BlockDuringImpersonation()
  @ApiOperation({ summary: "Self-service: org_admin creates their own staffing agency" })
  onboardAgency(@Body() dto: OnboardAgencyDto, @CurrentUser() user: UserEntity) {
    return this.service.onboardAgency(dto, user)
  }

  @Patch(":id")
  @UseGuards(EffectivePermissionsGuard)
  @RequiresPermission("manage_settings")
  @ApiOperation({ summary: "Update organization" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.service.update(id, dto, user)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @BlockDuringImpersonation()
  @ApiOperation({ summary: "Delete organization (admin only)" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.service.remove(id, user)
  }
}
