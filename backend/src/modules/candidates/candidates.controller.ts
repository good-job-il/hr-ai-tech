import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { CandidatesService } from "./candidates.service"
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  QueryCandidatesDto,
  CreateCandidateNoteDto,
  UpdateCandidateNoteDto,
  CreateCandidateTagDto,
  CreateCandidateProfileDto,
  UpdateCandidateProfileDto,
  CreateCandidateDocumentDto,
  CreateCandidateTimelineDto,
  CreateCandidateImportBatchDto,
} from "./dto/candidates.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { UserRole, ORG_ROLES } from "../../common/enums/user-role.enum"
import { UserEntity } from "../users/user.entity"
import { AgencyActionPolicyGuard } from "../permissions/agency-action-policy.guard"
import { RequiresPermission } from "../../common/decorators/requires-permission.decorator"

/** Roles allowed to create/modify candidate records (agency & admin staff only) */
const CANDIDATE_WRITE_ROLES = [...ORG_ROLES, UserRole.ADMIN]

const IMPORT_WRITE_ROLES = [
  UserRole.ORG_ADMIN,
  UserRole.RECRUITMENT_MANAGER,
  UserRole.TEAM_MANAGER,
  UserRole.ADMIN,
]

const ACCESS_WRITE_ROLES = [UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.ADMIN]

@ApiTags("Candidates")
@ApiBearerAuth()
@Controller("candidates")
@UseGuards(AgencyActionPolicyGuard)
export class CandidatesController {
  constructor(private readonly svc: CandidatesService) {}

  // ─── Static top-level sub-resources (MUST be declared before ':id') ──────

  // ─── Import Batches ───────────────────────────────────────────────────────
  @Get("import-batches")
  getBatches(@CurrentUser() user: UserEntity) {
    return this.svc.getBatches(user)
  }

  @Get("import-batches/:id")
  getBatch(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.getBatch(id, user)
  }

  @Post("import-batches")
  @Roles(...IMPORT_WRITE_ROLES)
  @RequiresPermission("create")
  @HttpCode(HttpStatus.CREATED)
  createBatch(@Body() data: CreateCandidateImportBatchDto, @CurrentUser() user: UserEntity) {
    return this.svc.createBatch(data, user)
  }

  // ─── Profile ─────────────────────────────────────────────────────────────
  @Get("profiles")
  @ApiOperation({ summary: "List candidate profiles (filter by user_email / is_public)" })
  listProfiles(
    @CurrentUser() user: UserEntity,
    @Query("user_email") userEmail?: string,
    @Query("is_public") isPublic?: string,
  ) {
    return this.svc.findAllProfiles(
      {
        user_email: userEmail,
        is_public: isPublic !== undefined ? isPublic === "true" : undefined,
      },
      user,
    )
  }

  @Get("profiles/me")
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: "Get the current candidate profile" })
  getMyProfile(@CurrentUser() user: UserEntity) {
    return this.svc.getProfile(user.email, user)
  }

  @Patch("profiles/me")
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: "Update the current candidate profile" })
  updateMyProfile(@Body() dto: UpdateCandidateProfileDto, @CurrentUser() user: UserEntity) {
    return this.svc.updateMyProfile(dto as any, user)
  }

  @Get("profiles/:email")
  @ApiOperation({ summary: "Get candidate profile by email" })
  getProfile(@Param("email") email: string, @CurrentUser() user: UserEntity) {
    return this.svc.getProfile(email, user)
  }

  @Post("profiles")
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.CREATED)
  createProfile(@Body() dto: CreateCandidateProfileDto, @CurrentUser() user: UserEntity) {
    return this.svc.upsertProfile(dto, user)
  }

  @Patch("profiles/:key")
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: "Update candidate profile by id or by email" })
  updateProfile(
    @Param("key") key: string,
    @Body() dto: UpdateCandidateProfileDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.updateProfileByKey(key, dto as any, user)
  }

  // ─── Access ──────────────────────────────────────────────────────────────
  @Get("access")
  @ApiOperation({ summary: "List candidate access grants (marketplace)" })
  listAccess(@CurrentUser() user: UserEntity, @Query("candidate_id") candidateId?: string) {
    return this.svc.findAllAccess({ candidate_id: candidateId }, user)
  }

  @Post("access")
  @Roles(...ACCESS_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createAccess(@Body() data: Record<string, any>, @CurrentUser() user: UserEntity) {
    return this.svc.createAccess(data, user)
  }

  @Patch("access/:id")
  @Roles(...ACCESS_WRITE_ROLES)
  updateAccess(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: Record<string, any>,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.updateAccess(id, data, user)
  }

  @Delete("access/:id")
  @Roles(...ACCESS_WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAccess(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.deleteAccess(id, user)
  }

  // ─── Notes (static prefix routes) ─────────────────────────────────────────
  @Patch("notes/:noteId")
  @Roles(...CANDIDATE_WRITE_ROLES)
  updateNote(
    @Param("noteId", ParseIntPipe) noteId: number,
    @Body() dto: UpdateCandidateNoteDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.updateNote(noteId, dto, user)
  }

  @Delete("notes/:noteId")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(@Param("noteId", ParseIntPipe) noteId: number, @CurrentUser() user: UserEntity) {
    return this.svc.deleteNote(noteId, user)
  }

  // ─── Tags (static prefix routes) ──────────────────────────────────────────
  @Delete("tags/:tagId")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTag(@Param("tagId", ParseIntPipe) tagId: number, @CurrentUser() user: UserEntity) {
    return this.svc.deleteTag(tagId, user)
  }

  // ─── Candidates (base CRUD) ────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: "List candidates (RLS scoped)" })
  findAll(@Query() query: QueryCandidatesDto, @CurrentUser() user: UserEntity) {
    return this.svc.findAll(query, user)
  }

  @Post()
  @Roles(...CANDIDATE_WRITE_ROLES)
  @RequiresPermission("create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create candidate" })
  create(@Body() dto: CreateCandidateDto, @CurrentUser() user: UserEntity) {
    return this.svc.create(dto, user)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get candidate by ID" })
  findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.findById(id, user)
  }

  @Patch(":id")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @RequiresPermission("update")
  @ApiOperation({ summary: "Update candidate" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.update(id, dto, user)
  }

  @Delete(":id")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @RequiresPermission("delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete candidate" })
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.softDelete(id, user)
  }

  // ─── Notes ───────────────────────────────────────────────────────────────
  @Get(":id/notes")
  getNotes(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.getNotes(id, user)
  }

  @Post(":id/notes")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createNote(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateCandidateNoteDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.createNote(id, dto, user)
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────
  @Get(":id/tags")
  getTags(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.getTags(id, user)
  }

  @Post(":id/tags")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createTag(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateCandidateTagDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.createTag(id, dto, user)
  }

  // ─── Timeline ────────────────────────────────────────────────────────────
  @Get(":id/timeline")
  getTimeline(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.getTimeline(id, user)
  }

  @Post(":id/timeline")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createTimelineEvent(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: CreateCandidateTimelineDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.createTimelineEvent({ ...data, candidate_id: id }, user)
  }

  // ─── Documents ───────────────────────────────────────────────────────────
  @Get(":id/documents")
  getDocuments(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.svc.getDocuments(id, user)
  }

  @Post(":id/documents")
  @Roles(...CANDIDATE_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createDocument(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateCandidateDocumentDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.svc.createDocument({ ...dto, candidate_id: id } as any, user)
  }
}
