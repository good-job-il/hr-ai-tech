import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, Repository, In, IsNull, Like, Not } from "typeorm"
import { CandidateEntity, CandidateSource } from "./entities/candidate.entity"
import { CandidateNoteEntity } from "./entities/candidate-note.entity"
import { CandidateTagEntity } from "./entities/candidate-tag.entity"
import { CandidateTimelineEntity } from "./entities/candidate-timeline.entity"
import { CandidateDocumentEntity } from "./entities/candidate-document.entity"
import { CandidateImportBatchEntity } from "./entities/candidate-import-batch.entity"
import { CandidateProfileEntity } from "./entities/candidate-profile.entity"
import { CandidateAccessEntity } from "./entities/candidate-access.entity"
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  QueryCandidatesDto,
  CreateCandidateNoteDto,
  UpdateCandidateNoteDto,
  CreateCandidateTagDto,
  CreateCandidateProfileDto,
  UpdateCandidateProfileDto,
} from "./dto/candidates.dto"
import { UserEntity } from "../users/user.entity"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { AuditLogEntity } from "../audit/audit-log.entity"
import { UserRole } from "../../common/enums/user-role.enum"
import { OrgType } from "../../common/enums/org-type.enum"
import { getRlsWhere, isBlocked } from "../../common/utils/rls.utils"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { PermissionsService } from "../permissions/permissions.service"

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(CandidateNoteEntity)
    private readonly noteRepo: Repository<CandidateNoteEntity>,
    @InjectRepository(CandidateTagEntity)
    private readonly tagRepo: Repository<CandidateTagEntity>,
    @InjectRepository(CandidateTimelineEntity)
    private readonly timelineRepo: Repository<CandidateTimelineEntity>,
    @InjectRepository(CandidateDocumentEntity)
    private readonly documentRepo: Repository<CandidateDocumentEntity>,
    @InjectRepository(CandidateImportBatchEntity)
    private readonly batchRepo: Repository<CandidateImportBatchEntity>,
    @InjectRepository(CandidateProfileEntity)
    private readonly profileRepo: Repository<CandidateProfileEntity>,
    @InjectRepository(CandidateAccessEntity)
    private readonly accessRepo: Repository<CandidateAccessEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    @Optional() private readonly dataSource?: DataSource,
    @Optional() private readonly permissions?: PermissionsService,
  ) {}

  // ─── Candidates ──────────────────────────────────────────────────────────
  async findAll(query: QueryCandidatesDto, user: UserEntity) {
    const {
      page,
      limit,
      sort,
      order,
      search,
      status,
      domain_id,
      role_id,
      recruiter_id,
      team_manager_id,
      is_deleted,
      parsing_status,
      review_required,
      import_batch_id,
      active,
      in_pipeline,
    } = query

    const rlsWhere = getRlsWhere("Candidate", {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
      team_id: user.team_id,
      employer_company_id: user.employer_company_id,
      email: user.email,
      impersonating: user.impersonating,
    })

    if (isBlocked(rlsWhere)) {
      return buildPaginatedResponse([], 0, { page, limit })
    }

    const where: Record<string, any> = { ...rlsWhere }

    if (status) {
      where.status = status
    }

    if (domain_id) {
      where.domain_id = domain_id
    }

    if (role_id) {
      where.role_id = role_id
    }

    if (recruiter_id && !("recruiter_id" in rlsWhere)) {
      where.recruiter_id = recruiter_id
    }

    if (team_manager_id && !("team_manager_id" in rlsWhere)) {
      where.team_manager_id = team_manager_id
    }

    if (is_deleted !== undefined && !("is_deleted" in rlsWhere)) {
      where.is_deleted = is_deleted
    }

    if (parsing_status) {
      where.parsing_status = parsing_status
    }

    if (review_required !== undefined) {
      where.review_required = review_required
    }

    if (import_batch_id) {
      where.import_batch_id = import_batch_id
    }

    if (active && status && ["hired", "rejected", "inactive"].includes(status)) {
      return buildPaginatedResponse([], 0, { page, limit })
    }

    if (active && !status) {
      where.status = Not(In(["hired", "rejected", "inactive"]))
    }

    if (in_pipeline) {
      const applicationScope = getRlsWhere("Application", {
        id: user.id,
        role: user.role,
        organization_id: user.organization_id,
        team_id: user.team_id,
        employer_company_id: user.employer_company_id,
        email: user.email,
        impersonating: user.impersonating,
      })

      if (isBlocked(applicationScope)) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      const applications = await this.applicationRepo.find({
        where: { ...applicationScope, status: Not(In(["completed", "rejected"])) } as any,
        select: { candidate_id: true },
      })

      const candidateIds = [
        ...new Set(
          applications.map((item) => item.candidate_id).filter((id): id is number => id != null),
        ),
      ]

      if (!candidateIds.length) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      where.id = In(candidateIds)
    }

    const { skip, take } = getSkipTake(page, limit)

    let findWhere: any = where

    if (search) {
      findWhere = [
        { ...where, full_name: Like(`%${search}%`) },
        { ...where, email: Like(`%${search}%`) },
        { ...where, role_name: Like(`%${search}%`) },
        { ...where, domain_name: Like(`%${search}%`) },
      ]
    }

    const [data, total] = await this.candidateRepo.findAndCount({
      where: findWhere,
      order: { [sort]: order },
      skip,
      take,
    })

    return buildPaginatedResponse(await this.applyCvPolicy(data, user), total, {
      page,
      limit,
      sort,
      order,
    })
  }

  async findById(id: number, user: UserEntity): Promise<CandidateEntity> {
    const candidate = await this.findByIdRaw(id, user)

    return this.applyCvPolicyToCandidate(candidate, user)
  }

  private async findByIdRaw(id: number, user: UserEntity): Promise<CandidateEntity> {
    const rlsWhere = getRlsWhere("Candidate", {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
      team_id: user.team_id,
      employer_company_id: user.employer_company_id,
      email: user.email,
      impersonating: user.impersonating,
    })

    if (isBlocked(rlsWhere)) {
      throw new NotFoundException(`Candidate ${id} not found`)
    }

    const candidate = await this.candidateRepo.findOne({ where: { ...rlsWhere, id } as any })

    if (!candidate) {
      throw new NotFoundException(`Candidate ${id} not found`)
    }

    return candidate
  }

  async findUnassignedPool(query: QueryCandidatesDto, user: UserEntity) {
    if (user.role !== UserRole.RECRUITER || !user.organization_id) {
      throw new ForbiddenException("Unassigned candidate pool is available to agency recruiters")
    }

    const { page, limit, sort, order, search, status, domain_id, role_id } = query

    const where: Record<string, any> = {
      organization_id: user.organization_id,
      recruiter_id: IsNull(),
      source: CandidateSource.POOL,
      is_deleted: false,
    }

    if (status) {
      where.status = status
    }

    if (domain_id) {
      where.domain_id = domain_id
    }

    if (role_id) {
      where.role_id = role_id
    }

    const findWhere = search
      ? [
          { ...where, full_name: Like(`%${search}%`) },
          { ...where, role_name: Like(`%${search}%`) },
          { ...where, domain_name: Like(`%${search}%`) },
        ]
      : where

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.candidateRepo.findAndCount({
      where: findWhere as any,
      order: { [sort]: order },
      skip,
      take,
    })

    return buildPaginatedResponse(await this.applyCvPolicy(data, user), total, {
      page,
      limit,
      sort,
      order,
    })
  }

  async claim(id: number, reason: string, user: UserEntity): Promise<CandidateEntity> {
    if (user.role !== UserRole.RECRUITER || !user.organization_id) {
      throw new ForbiddenException("Only an agency recruiter can claim a pool candidate")
    }

    if (!this.dataSource) {
      throw new Error("DataSource is required for an atomic candidate claim")
    }

    return this.dataSource.transaction(async (manager) => {
      const result = await manager
        .getRepository(CandidateEntity)
        .createQueryBuilder()
        .update(CandidateEntity)
        .set({
          recruiter_id: user.id,
          team_id: user.team_id ?? null,
          team_manager_id: user.team_manager_id ?? null,
          recruitment_manager_id: user.recruitment_manager_id ?? null,
        })
        .where("id = :id", { id })
        .andWhere("organization_id = :organizationId", { organizationId: user.organization_id })
        .andWhere("source = :source", { source: CandidateSource.POOL })
        .andWhere("recruiter_id IS NULL")
        .andWhere("is_deleted = :isDeleted", { isDeleted: false })
        .execute()

      if (result.affected !== 1) {
        throw new NotFoundException(`Claimable candidate ${id} not found`)
      }

      const candidate = await manager.getRepository(CandidateEntity).findOne({
        where: {
          id,
          organization_id: user.organization_id,
          recruiter_id: user.id,
          is_deleted: false,
        },
      })

      if (!candidate) {
        throw new NotFoundException(`Claimable candidate ${id} not found`)
      }

      await manager.save(
        CandidateTimelineEntity,
        manager.create(CandidateTimelineEntity, {
          candidate_id: candidate.id,
          organization_id: candidate.organization_id,
          candidate_email: candidate.email,
          event_type: "assigned",
          description: `Candidate claimed from the unassigned pool: ${reason.trim()}`,
          performed_by: user.email,
          performed_by_name: user.full_name,
          performed_by_role: user.role,
          metadata: { recruiter_id: user.id, claim_reason: reason.trim() },
        } as any),
      )
      await manager.save(
        AuditLogEntity,
        manager.create(AuditLogEntity, {
          organization_id: String(candidate.organization_id),
          actor_user_id: String(user.id),
          actor_email: user.email,
          actor_role: user.role,
          entity_type: "Candidate",
          entity_id: candidate.id,
          entity_label: candidate.full_name,
          action: "update",
          metadata: { operation: "claim", reason: reason.trim(), recruiter_id: user.id },
        }),
      )

      return this.applyCvPolicyToCandidate(candidate, user)
    })
  }

  private async applyCvPolicy(candidates: CandidateEntity[], user: UserEntity) {
    if (user.org_type !== OrgType.STAFFING_AGENCY || !this.permissions) {
      return candidates
    }

    const effective = await this.permissions.getEffectivePermissions(user)

    return effective.permissions.download_cv
      ? candidates
      : candidates.map((candidate) => this.redactCv(candidate))
  }

  private async applyCvPolicyToCandidate(candidate: CandidateEntity, user: UserEntity) {
    const [result] = await this.applyCvPolicy([candidate], user)

    return result
  }

  private redactCv(candidate: CandidateEntity): CandidateEntity {
    return {
      ...candidate,
      resume_url: null,
      original_resume_url: null,
      converted_resume_url: null,
      resume_filename: null,
      original_resume_filename: null,
      converted_resume_filename: null,
    } as CandidateEntity
  }

  async getCv(id: number, user: UserEntity) {
    const candidate = await this.findById(id, user)

    const fileUrl =
      candidate.converted_resume_url ?? candidate.resume_url ?? candidate.original_resume_url

    if (!fileUrl) {
      throw new NotFoundException(`CV for candidate ${id} not found`)
    }

    if (this.dataSource) {
      await this.dataSource.getRepository(AuditLogEntity).save(
        this.dataSource.getRepository(AuditLogEntity).create({
          organization_id:
            candidate.organization_id == null ? null : String(candidate.organization_id),
          actor_user_id: String(user.id),
          actor_email: user.email,
          actor_role: user.role,
          entity_type: "CandidateDocument",
          entity_id: candidate.id,
          entity_label: candidate.resume_filename ?? candidate.full_name,
          action: "cv_download",
          metadata: { candidate_id: candidate.id },
        }),
      )
    }

    return { candidate_id: candidate.id, filename: candidate.resume_filename, file_url: fileUrl }
  }

  async create(dto: CreateCandidateDto, user: UserEntity): Promise<CandidateEntity> {
    this.assertRecruiterOwnership(dto, user)

    const assignmentTeamId = await this.assertAgencyAssignments(dto, user)

    const candidate = this.candidateRepo.create({
      ...dto,
      organization_id: user.organization_id,
      team_id: user.role === UserRole.RECRUITER ? (user.team_id ?? null) : assignmentTeamId,
      recruiter_id: dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
      team_manager_id:
        user.role === UserRole.RECRUITER
          ? (user.team_manager_id ?? null)
          : user.role === UserRole.TEAM_MANAGER
            ? user.id
            : dto.team_manager_id,
      recruitment_manager_id:
        user.role === UserRole.RECRUITER
          ? (user.recruitment_manager_id ?? null)
          : dto.recruitment_manager_id,
    } as any) as unknown as CandidateEntity

    const saved = await this.candidateRepo.save(candidate)

    return this.applyCvPolicyToCandidate(saved as CandidateEntity, user)
  }

  async update(id: number, dto: UpdateCandidateDto, user: UserEntity): Promise<CandidateEntity> {
    this.assertRecruiterOwnership(dto, user)

    const assignmentTeamId = await this.assertAgencyAssignments(dto, user)

    const candidate = await this.findByIdRaw(id, user)

    const updates: Record<string, any> = { ...dto }

    if (user.role === UserRole.RECRUITER) {
      delete updates.recruiter_id
      delete updates.team_manager_id
      delete updates.recruitment_manager_id
    }

    Object.assign(candidate, updates)

    if (assignmentTeamId != null) {
      candidate.team_id = assignmentTeamId

      if (user.role === UserRole.TEAM_MANAGER) {
        candidate.team_manager_id = user.id
      }
    }

    if (dto.is_deleted && !candidate.deleted_at) {
      candidate.deleted_at = new Date()
      candidate.deleted_by = user.id
    }

    const saved = await this.candidateRepo.save(candidate)

    return this.applyCvPolicyToCandidate(saved as CandidateEntity, user)
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user)
  }

  private assertRecruiterOwnership(dto: Partial<CreateCandidateDto>, user: UserEntity) {
    if (user.role !== UserRole.RECRUITER) {
      return
    }

    const expected: Record<string, number | null> = {
      recruiter_id: user.id,
      team_manager_id: user.team_manager_id ?? null,
      recruitment_manager_id: user.recruitment_manager_id ?? null,
    }

    for (const [field, canonical] of Object.entries(expected)) {
      if (field in dto && (dto as Record<string, any>)[field] !== canonical) {
        throw new ForbiddenException(`${field} is derived from recruiter membership`)
      }
    }
  }

  private async assertAgencyAssignments(dto: Partial<CreateCandidateDto>, user: UserEntity) {
    if (user.org_type !== "staffing_agency") {
      return null
    }

    if (!user.organization_id) {
      throw new ForbiddenException("Organization context required")
    }

    const fields: Array<[keyof CreateCandidateDto, UserRole]> = [
      ["recruiter_id", UserRole.RECRUITER],
      ["team_manager_id", UserRole.TEAM_MANAGER],
      ["recruitment_manager_id", UserRole.RECRUITMENT_MANAGER],
    ]

    const teamIds = new Set<number>()

    for (const [field, role] of fields) {
      const id = dto[field]

      if (id == null) {
        continue
      }

      const assignee = await this.userRepo.findOne({
        where: { id: Number(id), organization_id: user.organization_id, role, is_active: true },
      })

      if (!assignee) {
        throw new ForbiddenException(`Invalid ${String(field)} assignment`)
      }

      if (user.role === UserRole.TEAM_MANAGER) {
        if (!user.team_id || assignee.team_id !== user.team_id) {
          throw new ForbiddenException("Assignee must belong to the Team Manager's team")
        }

        if (field === "team_manager_id" && assignee.id !== user.id) {
          throw new ForbiddenException("Team Manager cannot assign another team manager")
        }
      }

      if (assignee.team_id) {
        teamIds.add(assignee.team_id)
      }
    }

    if (teamIds.size > 1) {
      throw new BadRequestException("All assignees must belong to the same team")
    }

    if (user.role === UserRole.TEAM_MANAGER) {
      if (!user.team_id) {
        throw new ForbiddenException("Active team membership required")
      }

      return user.team_id
    }

    return [...teamIds][0] ?? null
  }

  // ─── Notes ──────────────────────────────────────────────────────────────
  async getNotes(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user)

    return this.noteRepo.find({
      where: { candidate_id: candidateId },
      order: { is_pinned: "DESC", created_date: "DESC" },
    })
  }

  async createNote(candidateId: number, dto: CreateCandidateNoteDto, user: UserEntity) {
    const candidate = await this.findById(candidateId, user)

    const note = this.noteRepo.create({
      ...dto,
      candidate_id: candidateId,
      candidate_email: candidate.email,
      author_email: user.email,
      author_name: user.full_name,
      author_role: user.role,
      organization_id: user.organization_id,
    } as any)

    return this.noteRepo.save(note)
  }

  async updateNote(noteId: number, dto: UpdateCandidateNoteDto, user: UserEntity) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } })

    if (!note) {
      throw new NotFoundException(`Note ${noteId} not found`)
    }

    await this.findById(note.candidate_id, user)
    Object.assign(note, dto)

    return this.noteRepo.save(note)
  }

  async deleteNote(noteId: number, user: UserEntity) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } })

    if (!note) {
      throw new NotFoundException(`Note ${noteId} not found`)
    }

    await this.findById(note.candidate_id, user)
    await this.noteRepo.remove(note)
  }

  // ─── Tags ──────────────────────────────────────────────────────────────
  async getTags(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user)

    return this.tagRepo.find({ where: { candidate_id: candidateId } })
  }

  async createTag(candidateId: number, dto: CreateCandidateTagDto, user: UserEntity) {
    await this.findById(candidateId, user)

    const tag = this.tagRepo.create({
      ...dto,
      candidate_id: candidateId,
      added_by: user.email,
    } as any)

    return this.tagRepo.save(tag)
  }

  async deleteTag(tagId: number, user: UserEntity) {
    const tag = await this.tagRepo.findOne({ where: { id: tagId } })

    if (!tag) {
      throw new NotFoundException(`Tag ${tagId} not found`)
    }

    await this.findById(tag.candidate_id, user)
    await this.tagRepo.remove(tag)
  }

  // ─── Timeline ───────────────────────────────────────────────────────────
  async getTimeline(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user)

    return this.timelineRepo.find({
      where: { candidate_id: candidateId },
      order: { created_date: "DESC" },
    })
  }

  async createTimelineEvent(data: Partial<CandidateTimelineEntity>, user: UserEntity) {
    const candidate = await this.findById(data.candidate_id!, user)

    const event = this.timelineRepo.create({
      ...data,
      organization_id: user.organization_id,
      candidate_email: candidate.email,
      performed_by: user.email,
      performed_by_name: user.full_name,
      performed_by_role: user.role,
    })

    return this.timelineRepo.save(event)
  }

  // ─── Documents ──────────────────────────────────────────────────────────
  async getDocuments(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user)

    const documents = await this.documentRepo.find({
      where: { candidate_id: candidateId },
      order: { uploaded_at: "DESC" },
    })

    if (user.org_type !== OrgType.STAFFING_AGENCY || !this.permissions) {
      return documents
    }

    const effective = await this.permissions.getEffectivePermissions(user)

    return effective.permissions.download_cv
      ? documents
      : documents.map((document) =>
          document.doc_type === "cv" ? { ...document, file_url: null } : document,
        )
  }

  async createDocument(data: Partial<CandidateDocumentEntity>, user: UserEntity) {
    const candidate = await this.findById(data.candidate_id!, user)

    const doc = this.documentRepo.create({
      ...data,
      organization_id: user.organization_id,
      candidate_email: candidate.email,
      uploaded_by: user.email,
    } as any) as unknown as CandidateDocumentEntity

    const saved = await this.documentRepo.save(doc)

    if (saved.doc_type !== "cv" || user.org_type !== OrgType.STAFFING_AGENCY || !this.permissions) {
      return saved
    }

    const effective = await this.permissions.getEffectivePermissions(user)

    return effective.permissions.download_cv ? saved : { ...saved, file_url: null }
  }

  // ─── Import Batches ──────────────────────────────────────────────────────
  async getBatches(user: UserEntity) {
    const where = getRlsWhere("CandidateImportBatch", {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
      team_id: user.team_id,
      employer_company_id: user.employer_company_id,
      email: user.email,
      impersonating: user.impersonating,
    })

    if (isBlocked(where)) {
      return []
    }

    return this.batchRepo.find({ where, order: { created_date: "DESC" } })
  }

  async getBatch(id: number, user: UserEntity) {
    const rlsWhere = getRlsWhere("CandidateImportBatch", {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
      team_id: user.team_id,
      employer_company_id: user.employer_company_id,
      email: user.email,
      impersonating: user.impersonating,
    })

    if (isBlocked(rlsWhere)) {
      throw new NotFoundException(`Import batch ${id} not found`)
    }

    const batch = await this.batchRepo.findOne({ where: { ...rlsWhere, id } as any })

    if (!batch) {
      throw new NotFoundException(`Import batch ${id} not found`)
    }

    return batch
  }

  async createBatch(data: Partial<CandidateImportBatchEntity>, user: UserEntity) {
    const assignees = await this.assertOrganizationUsers(
      [data.recruiter_id, data.team_manager_id, data.recruitment_manager_id],
      user,
    )

    const batch = this.batchRepo.create({
      ...data,
      organization_id: user.organization_id,
      team_id:
        user.role === UserRole.TEAM_MANAGER
          ? user.team_id
          : (assignees.find((member) => member.team_id)?.team_id ?? null),
      recruiter_id: data.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
      team_manager_id: user.role === UserRole.TEAM_MANAGER ? user.id : data.team_manager_id,
      recruitment_manager_id:
        data.recruitment_manager_id ??
        (user.role === UserRole.RECRUITMENT_MANAGER ? user.id : null),
      imported_by: user.email,
      status: "pending",
    })

    return this.batchRepo.save(batch)
  }

  async assertOrganizationUsers(ids: Array<number | null | undefined>, user: UserEntity) {
    if (user.role === UserRole.ADMIN) {
      return []
    }

    const members: UserEntity[] = []

    for (const id of [...new Set(ids.filter((value): value is number => Boolean(value)))]) {
      const member = await this.userRepo.findOne({
        where: { id, organization_id: user.organization_id },
      })

      if (!member) {
        throw new ForbiddenException(`User ${id} belongs to another organization`)
      }

      if (
        user.role === UserRole.TEAM_MANAGER &&
        (!user.team_id || member.team_id !== user.team_id)
      ) {
        throw new ForbiddenException(`User ${id} belongs to another team`)
      }

      members.push(member)
    }

    return members
  }

  async updateBatch(id: number, data: Partial<CandidateImportBatchEntity>, user: UserEntity) {
    const batch = await this.getBatch(id, user)

    const updates = { ...data }

    delete updates.organization_id
    delete updates.team_id
    delete updates.team_manager_id
    delete updates.recruiter_id
    delete updates.recruitment_manager_id
    Object.assign(batch, updates)

    return this.batchRepo.save(batch)
  }

  // ─── Profile ─────────────────────────────────────────────────────────────
  async getProfile(userEmail: string, user: UserEntity) {
    if (user.role === UserRole.CANDIDATE && userEmail !== user.email) {
      throw new ForbiddenException("Access denied")
    }

    if (
      [
        UserRole.ORG_ADMIN,
        UserRole.RECRUITMENT_MANAGER,
        UserRole.TEAM_MANAGER,
        UserRole.RECRUITER,
        UserRole.INTERNAL_RECRUITER,
      ].includes(user.role)
    ) {
      const scope = getRlsWhere("Candidate", {
        id: user.id,
        role: user.role,
        organization_id: user.organization_id,
        team_id: user.team_id,
        employer_company_id: user.employer_company_id,
        email: user.email,
        impersonating: user.impersonating,
      })

      const candidate = isBlocked(scope)
        ? null
        : await this.candidateRepo.findOne({ where: { ...scope, email: userEmail } as any })

      if (!candidate) {
        throw new NotFoundException("Candidate profile not found")
      }
    }

    return this.profileRepo.findOne({
      where: user.role === UserRole.CANDIDATE ? { user_id: user.id } : { user_email: userEmail },
    })
  }

  /** Flat candidate-profile list with optional filters. */
  async findAllProfiles(filters: { user_email?: string; is_public?: boolean }, user: UserEntity) {
    const where: Record<string, any> = {}

    if (user.role === UserRole.CANDIDATE) {
      where.user_id = user.id
    } else if (filters.user_email) {
      where.user_email = filters.user_email
    }

    if (
      [
        UserRole.ORG_ADMIN,
        UserRole.RECRUITMENT_MANAGER,
        UserRole.TEAM_MANAGER,
        UserRole.RECRUITER,
        UserRole.INTERNAL_RECRUITER,
      ].includes(user.role)
    ) {
      const scope = getRlsWhere("Candidate", {
        id: user.id,
        role: user.role,
        organization_id: user.organization_id,
        team_id: user.team_id,
        employer_company_id: user.employer_company_id,
        email: user.email,
        impersonating: user.impersonating,
      })

      if (isBlocked(scope)) {
        return []
      }

      const candidates = await this.candidateRepo.find({
        where: filters.user_email ? ({ ...scope, email: filters.user_email } as any) : scope,
        select: { email: true },
      })

      const emails = candidates
        .map((candidate) => candidate.email)
        .filter((email): email is string => Boolean(email))

      if (!emails.length) {
        return []
      }

      where.user_email = In(emails)
    }

    if (filters.is_public !== undefined) {
      where.is_public = filters.is_public
    }

    return this.profileRepo.find({ where, order: { created_date: "DESC" } as any })
  }

  async upsertProfile(
    dto: CreateCandidateProfileDto | UpdateCandidateProfileDto,
    user: UserEntity,
  ) {
    const userEmail = user.email

    if (!userEmail) {
      throw new BadRequestException("user_email is required")
    }

    const existing = await this.profileRepo.findOne({ where: { user_id: user.id } })

    if (existing) {
      Object.assign(existing, dto)

      return this.profileRepo.save(existing)
    }

    const profile = this.profileRepo.create({
      ...dto,
      user_id: user.id,
      user_email: userEmail,
    } as any)

    return this.profileRepo.save(profile)
  }

  async updateMyProfile(dto: Partial<CandidateProfileEntity>, user: UserEntity) {
    const existing = await this.profileRepo.findOne({ where: { user_id: user.id } })

    if (!existing) {
      throw new NotFoundException("Candidate profile not found")
    }

    delete dto.user_email
    delete dto.user_id
    Object.assign(existing, dto)

    return this.profileRepo.save(existing)
  }

  /** Update by profile id (int) or user_email. */
  async updateProfileByKey(key: string, dto: Partial<CandidateProfileEntity>, user: UserEntity) {
    if (user.role === UserRole.CANDIDATE && key !== user.email) {
      const numericKey = Number(key)

      const owned = Number.isInteger(numericKey)
        ? await this.profileRepo.findOne({ where: { id: numericKey, user_id: user.id } })
        : null

      if (!owned) {
        throw new ForbiddenException("Access denied")
      }
    }

    const numericId = parseInt(key, 10)

    let existing: CandidateProfileEntity | null = null

    if (!isNaN(numericId)) {
      existing = await this.profileRepo.findOne({ where: { id: numericId } })
    }

    if (!existing) {
      existing = await this.profileRepo.findOne({ where: { user_email: key } })
    }

    if (!existing) {
      throw new NotFoundException(`Candidate profile ${key} not found`)
    }

    if (user.role === UserRole.CANDIDATE && existing.user_id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    delete dto.user_email
    Object.assign(existing, dto)

    return this.profileRepo.save(existing)
  }

  // ─── Access ──────────────────────────────────────────────────────────────
  async getAccess(candidateId: number) {
    return this.accessRepo.find({ where: { candidate_id: candidateId } })
  }

  /** Flat candidate-access list with optional filters. */
  async findAllAccess(filters: Record<string, any> = {}, user: UserEntity) {
    const isGlobalAdmin = user.role === UserRole.ADMIN && !user.impersonating

    if (!isGlobalAdmin && !user.organization_id) {
      return []
    }

    if (
      [UserRole.TEAM_MANAGER, UserRole.RECRUITER, UserRole.INTERNAL_RECRUITER].includes(user.role)
    ) {
      let candidateIds: number[]

      if (filters.candidate_id) {
        const candidate = await this.findById(Number(filters.candidate_id), user)

        candidateIds = [candidate.id]
      } else {
        const scope = getRlsWhere("Candidate", {
          id: user.id,
          role: user.role,
          organization_id: user.organization_id,
          team_id: user.team_id,
          employer_company_id: user.employer_company_id,
          email: user.email,
          impersonating: user.impersonating,
        })

        if (isBlocked(scope)) {
          return []
        }

        const candidates = await this.candidateRepo.find({ where: scope, select: { id: true } })

        candidateIds = candidates.map((candidate) => candidate.id)
      }

      if (!candidateIds.length) {
        return []
      }

      return this.accessRepo.find({
        where: { candidate_id: In(candidateIds), owner_organization_id: user.organization_id },
        order: { created_date: "DESC" } as any,
      })
    }

    const base = filters.candidate_id ? { candidate_id: filters.candidate_id } : {}

    const where: any = isGlobalAdmin
      ? base
      : [
          { ...base, owner_organization_id: user.organization_id },
          { ...base, accessor_organization_id: user.organization_id },
        ]

    return this.accessRepo.find({ where, order: { created_date: "DESC" } as any })
  }

  async createAccess(data: Partial<CandidateAccessEntity>, user: UserEntity) {
    const candidate = await this.findById(data.candidate_id!, user)

    if (!candidate.organization_id) {
      throw new ForbiddenException("Candidate has no organization scope")
    }

    const access = this.accessRepo.create({
      ...data,
      owner_organization_id: candidate.organization_id,
      granted_by: user.id,
      granted_at: new Date(),
    })

    return this.accessRepo.save(access)
  }

  async updateAccess(id: number, data: Partial<CandidateAccessEntity>, user: UserEntity) {
    const access = await this.accessRepo.findOne({ where: { id } })

    if (!access) {
      throw new NotFoundException(`Access ${id} not found`)
    }

    this.assertAccessGrantOwner(access, user)

    const updates = { ...data }

    delete updates.owner_organization_id
    delete updates.candidate_id
    delete updates.granted_by
    Object.assign(access, updates)

    return this.accessRepo.save(access)
  }

  async deleteAccess(id: number, user: UserEntity) {
    const access = await this.accessRepo.findOne({ where: { id } })

    if (!access) {
      throw new NotFoundException(`Access ${id} not found`)
    }

    this.assertAccessGrantOwner(access, user)
    await this.accessRepo.remove(access)
  }

  // ─── Private helpers ─────────────────────────────────────────────────────
  private assertAccessGrantOwner(access: CandidateAccessEntity, user: UserEntity) {
    const isGlobalAdmin = user.role === UserRole.ADMIN && !user.impersonating

    if (!isGlobalAdmin && access.owner_organization_id !== user.organization_id) {
      throw new ForbiddenException("Access denied")
    }
  }
}
