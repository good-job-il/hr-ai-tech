import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ImportSourcesService } from './import-sources.service';
import { CreateImportSourceDto, UpdateImportSourceDto, QueryImportSourcesDto } from './dto/import-source.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Import Sources')
@ApiBearerAuth()
@Controller('import-sources')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ImportSourcesController {
  constructor(private readonly svc: ImportSourcesService) {}

  @Get() findAll(@Query() q: QueryImportSourcesDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findById(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateImportSourceDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateImportSourceDto) { return this.svc.update(id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}

