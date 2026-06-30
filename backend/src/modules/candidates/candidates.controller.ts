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
} from './dto/candidates.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly svc: CandidatesService) {}

  // ─── Candidates ──────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List candidates (RLS scoped)' })
  findAll(@Query() query: QueryCandidatesDto, @CurrentUser() user: UserEntity) {
    return this.svc.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.findById(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create candidate' })
  create(@Body() dto: CreateCandidateDto, @CurrentUser() user: UserEntity) {
    return this.svc.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update candidate' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.update(id, dto, user);
  }

  @Delete(':id')
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

  @Delete('tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTag(@Param('tagId', ParseUUIDPipe) tagId: string, @CurrentUser() user: UserEntity) {
    return this.svc.deleteTag(tagId, user);
  }

  // ─── Timeline ────────────────────────────────────────────────────────────
  @Get(':id/timeline')
  getTimeline(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.getTimeline(id, user);
  }

  // ─── Documents ───────────────────────────────────────────────────────────
  @Get(':id/documents')
  getDocuments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserEntity) {
    return this.svc.getDocuments(id, user);
  }

  // ─── Import Batches ───────────────────────────────────────────────────────
  @Get('import-batches')
  getBatches(@CurrentUser() user: UserEntity) {
    return this.svc.getBatches(user);
  }

  @Get('import-batches/:id')
  getBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getBatch(id);
  }

  // ─── Profile ─────────────────────────────────────────────────────────────
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

  @Patch('profiles/:email')
  updateProfile(
    @Param('email') email: string,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.svc.upsertProfile({ ...dto, user_email: email } as any);
  }
}

