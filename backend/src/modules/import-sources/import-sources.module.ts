import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ImportSourceEntity } from "./import-source.entity"
import { ImportSourcesService } from "./import-sources.service"
import { ImportSourcesController } from "./import-sources.controller"

@Module({
  imports: [TypeOrmModule.forFeature([ImportSourceEntity])],
  controllers: [ImportSourcesController],
  providers: [ImportSourcesService],
  exports: [ImportSourcesService, TypeOrmModule],
})
export class ImportSourcesModule {}
