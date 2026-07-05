import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import {
  CreateCandidateDto, UpdateCandidateDto, QueryCandidatesDto,
  CreateCandidateNoteDto, UpdateCandidateNoteDto,
  CreateCandidateTagDto,
  CreateCandidateProfileDto, UpdateCandidateProfileDto,
  CreateCandidateDocumentDto,
} from './dto/candidates.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ORG_ROLES } from '../../common/enums/user-role.enum';
import { UserEntity } from '../users/user.entity';

/** Roles allowed to create/modify candidate records (agency & admin staff only) */
const CANDIDATE_WRITE_ROLES = [...ORG_ROLES, UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly svc: CandidatesService) {}

  // ─── Static top-level sub-resources (MUST be declared before ':id') ──────

  // ─── Import Batches ───────────────────────────────────────────────────────
  @Get('import-batches')
  getBatches(@CurrentUser() user: UserEntity) {
    return this.svc.getBatches(user);
  }

  @Get('import-batches/:id')
  getBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getBatch(id);
  }

  @Post('import-batches')
  @HttpCode(HttpStatus.CREATED)
  createBatch(@Body() data: Record<string, any>) {
    return this.svc.createBatch(data);
  }

  @Patch('import-batches/:id')
  updateBatch(@Param('id', ParseUUIDPipe) id: string, @Body() data: Record<string, any>) {
    return this.svc.updateBatch(id, data);
  }

  // ─── Profile ─────────────────────────────────────────────────────────────
  @Get('profiles')
  @ApiOperation({ summary: 'List candidate profiles (filter by user_email / is_public)' })
  listProfiles(@Query('user_email') userEmail?: string, @Query('is_public') isPublic?: string) {
    return this.svc.findAllProfiles({
      user_email: userEmail,
      is_public: isPublic !== undefined ? isPublic === 'true' : undefined,
    });
  }

  @Get('profiles/:email')
  @ApiOperation({ summary: 'Get candidate profile by email' })
  getProfile(@Param('email') email: string) {
    return this.svc.getProfile(email);
  }

  @Post('profiles')
  @HttpCode(HttpStatus.CREATED)
  createProfile(@Body() dto: CreateCandidateProfileDto) {
    return this.svc.upsertProfile(dto);
  }

  @Patch('profiles/:key')
  @ApiOperation({ summary: 'Update candidate profile by id or by email' })
  updateProfile(
    @Param('key') key: string,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.svc.updateProfileByKey(key, dto as any);
  }

  // ─── Access ──────────────────────────────────────────────────────────────
  @Get('access')
  @ApiOperation({ summary: 'List candidate access grants (marketplace)' })
  listAccess(@Query('candidate_id') candidateId?: string) {
    return this.svc.findAllAccess({ candidate_id: candidateId });
  }

  @Post('access')
  @HttpCode(HttpStatus.CREATED)
  createAccess(@Body() data: Record<string, any>) {
    return this.svc.createAccess(data);
  }

  @Patch('access/:id')
  updateAccess(@Param('id', ParseUUIDPipe) id: string, @Body() data: Record<string, any>) {
    return this.svc.updateAccess(id, data);
  }

  @Delete('access/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAccess(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deleteAccess(id);
  }

  // ─── Notes (static prefix routes) ─────────────────────────────────────────
  @Patch('notes/:noteId')
  updateNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateCandidateNoteDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.updateNote(noteId, dto, user);
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(@Param('noteId', ParseUUIDPipe) noteId: string, @CurrentUser() user: UserEntity) {
    return this.svc.deleteNote(noteId, user);
  }

  // ─── Tags (static prefix routes) ──────────────────────────────────────────
  @Delete('tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTag(@Param('tagId', ParseUUIDPipe) tagId: string, @CurrentUser() user: UserEntity) {
    return this.svc.deleteTag(tagId, user);
  }

  // ─── Candidates (base CRUD) ────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List candidates (RLS scoped)' })
  findAll(@Query() query: QueryCandidatesDto, @CurrentUser() user: UserEntity) {
    return this.svc.findAll(query, user);
  }

  @Post()
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create candidate' })
  create(@Body() dto: CreateCandidateDto, @CurrentUser() user: UserEntity) {
    return this.svc.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.findById(id, user);
  }

  @Patch(':id')
  @Roles(...CANDIDATE_WRITE_ROLES)
  @ApiOperation({ summary: 'Update candidate' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete candidate' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.softDelete(id, user);
  }

  // ─── Notes ───────────────────────────────────────────────────────────────
  @Get(':id/notes')
  getNotes(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.getNotes(id, user);
  }

  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCandidateNoteDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.createNote({ ...dto, candidate_id: id }, user);
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────
  @Get(':id/tags')
  getTags(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.getTags(id, user);
  }

  @Post(':id/tags')
  @HttpCode(HttpStatus.CREATED)
  createTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCandidateTagDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.createTag({ ...dto, candidate_id: id }, user);
  }

  // ─── Timeline ────────────────────────────────────────────────────────────
  @Get(':id/timeline')
  getTimeline(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.getTimeline(id, user);
  }

  @Post(':id/timeline')
  @HttpCode(HttpStatus.CREATED)
  createTimelineEvent(@Param('id', ParseUUIDPipe) id: string, @Body() data: Record<string, any>) {
    return this.svc.createTimelineEvent({ ...data, candidate_id: id });
  }

  // ─── Documents ───────────────────────────────────────────────────────────
  @Get(':id/documents')
  getDocuments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.getDocuments(id, user);
  }

  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  createDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCandidateDocumentDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.createDocument({ ...dto, candidate_id: id, uploaded_by: dto.uploaded_by ?? user.email } as any, user);
  }
}

