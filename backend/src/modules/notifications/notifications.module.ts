import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationEntity } from "./notification.entity"
import { NotificationsService } from "./notifications.service"
import { NotificationsController } from "./notifications.controller"
import { UserEntity } from "../users/user.entity"

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, UserEntity])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
