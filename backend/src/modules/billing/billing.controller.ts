import { Controller, Get } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { UserEntity } from "../users/user.entity"
import { BillingService } from "./billing.service"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserRole } from "../../common/enums/user-role.enum"

@ApiTags("Billing")
@ApiBearerAuth()
@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get("overview")
  @Roles(UserRole.ADMIN, UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER)
  overview(@CurrentUser() user: UserEntity) {
    return this.billing.overview(user)
  }
}
