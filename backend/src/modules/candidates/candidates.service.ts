import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Not } from 'typeorm';
import { CandidateEntity } from './entities/candidate.entity';
import { CandidateNoteEntity } from './entities/candidate-note.entity';
import { CandidateTagEntity } from './entities/candidate-tag.entity';
import { CandidateTimelineEntity } from './entities/candidate-timeline.entity';
import { CandidateDocumentEntity } from './entities/candidate-document.entity';
import { CandidateImportBatchEntity } from './entities/candidate-import-batch.entity';
import { CandidateProfileEntity } from './entities/candidate-profile.entity';
import { CandidateAccessEntity } from './entities/candidate-access.entity';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  QueryCandidatesDto,
  CreateCandidateNoteDto,
  UpdateCandidateNoteDto,
  CreateCandidateTagDto,
  CreateCandidateProfileDto,
  UpdateCandidateProfileDto,
} from './dto/candidates.dto';
import { UserEntity } from '../users/user.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { getRlsWhere, isBlocked } from '../../common/utils/rls.utils';
import {
  buildPaginatedResponse,
  getSkipTake,
} from '../../common/utils/pagination.utils';

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
  ) {}

  // ─── Candidates ──────────────────────────────────────────────────────────
  async findAll(query: QueryCandidatesDto, user: UserEntity) {
    const { page, limit, sort, order, search, status, domain_id, role_id,
      recruiter_id, team_manager_id, is_deleted, parsing_status, review_required, import_batch_id,
      active, in_pipeline } = query;

    const rlsWhere = getRlsWhere('Candidate', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });

    if (isBlocked(rlsWhere)) return buildPaginatedResponse([], 0, { page, limit });

    const where: Record<string, any> = { ...rlsWhere };
    if (status) where.status = status;
    if (domain_id) where.domain_id = domain_id;
    if (role_id) where.role_id = role_id;
    if (recruiter_id && !('recruiter_id' in rlsWhere)) where.recruiter_id = recruiter_id;
    if (team_manager_id && !('team_manager_id' in rlsWhere)) where.team_manager_id = team_manager_id;
    if (is_deleted !== undefined && !('is_deleted' in rlsWhere)) where.is_deleted = is_deleted;
    if (parsing_status) where.parsing_status = parsing_status;
    if (review_required !== undefined) where.review_required = review_required;
    if (import_batch_id) where.import_batch_id = import_batch_id;
    if (active && status && ['hired', 'rejected', 'inactive'].includes(status)) {
      return buildPaginatedResponse([], 0, { page, limit });
    }
    if (active && !status) where.status = Not(In(['hired', 'rejected', 'inactive']));
    if (in_pipeline) {
      const applicationScope = getRlsWhere('Application', {
        id: user.id, role: user.role, organization_id: user.organization_id,
        employer_company_id: user.employer_company_id, email: user.email,
        impersonating: user.impersonating,
      });
      if (isBlocked(applicationScope)) return buildPaginatedResponse([], 0, { page, limit });
      const applications = await this.applicationRepo.find({
        where: { ...applicationScope, status: Not(In(['completed', 'rejected'])) } as any,
        select: { candidate_id: true },
      });
      const candidateIds = [...new Set(applications.map(item => item.candidate_id).filter((id): id is number => id != null))];
      if (!candidateIds.length) return buildPaginatedResponse([], 0, { page, limit });
      where.id = In(candidateIds);
    }

    const { skip, take } = getSkipTake(page, limit);

    let findWhere: any = where;
    if (search) {
      findWhere = [
        { ...where, full_name: Like(`%${search}%`) },
        { ...where, email: Like(`%${search}%`) },
        { ...where, role_name: Like(`%${search}%`) },
        { ...where, domain_name: Like(`%${search}%`) },
      ];
    }

    const [data, total] = await this.candidateRepo.findAndCount({
      where: findWhere,
      order: { [sort]: order },
      skip,
      take,
    });

    return buildPaginatedResponse(data, total, { page, limit, sort, order });
  }

  async findById(id: number, user: UserEntity): Promise<CandidateEntity> {
    const rlsWhere = getRlsWhere('Candidate', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(rlsWhere)) throw new NotFoundException(`Candidate ${id} not found`);
    const candidate = await this.candidateRepo.findOne({ where: { ...rlsWhere, id } as any });
    if (!candidate) throw new NotFoundException(`Candidate ${id} not found`);
    return candidate;
  }

  async create(dto: CreateCandidateDto, user: UserEntity): Promise<CandidateEntity> {
    const candidate = this.candidateRepo.create({
      ...dto,
      organization_id: user.organization_id,
      recruiter_id: dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
      team_manager_id: dto.team_manager_id ?? (user.role === UserRole.TEAM_MANAGER ? user.id : null),
    } as any);
    return this.candidateRepo.save(candidate) as unknown as Promise<CandidateEntity>;
  }

  async update(id: number, dto: UpdateCandidateDto, user: UserEntity): Promise<CandidateEntity> {
    const candidate = await this.findById(id, user);
    Object.assign(candidate, dto);
    if (dto.is_deleted && !candidate.deleted_at) {
      candidate.deleted_at = new Date();
      candidate.deleted_by = user.id;
    }
    return this.candidateRepo.save(candidate) as unknown as Promise<CandidateEntity>;
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user);
  }

  // ─── Notes ──────────────────────────────────────────────────────────────
  async getNotes(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.noteRepo.find({
      where: { candidate_id: candidateId },
      order: { is_pinned: 'DESC', created_date: 'DESC' },
    });
  }

  async createNote(candidateId: number, dto: CreateCandidateNoteDto, user: UserEntity) {
    const candidate = await this.findById(candidateId, user);
    const note = this.noteRepo.create({
      ...dto,
      candidate_id: candidateId,
      candidate_email: candidate.email,
      author_email: user.email,
      author_name: user.full_name,
      author_role: user.role,
      organization_id: user.organization_id,
    } as any);
    return this.noteRepo.save(note);
  }

  async updateNote(noteId: number, dto: UpdateCandidateNoteDto, user: UserEntity) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    await this.findById(note.candidate_id, user);
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }

  async deleteNote(noteId: number, user: UserEntity) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    await this.findById(note.candidate_id, user);
    await this.noteRepo.remove(note);
  }

  // ─── Tags ──────────────────────────────────────────────────────────────
  async getTags(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.tagRepo.find({ where: { candidate_id: candidateId } });
  }

  async createTag(candidateId: number, dto: CreateCandidateTagDto, user: UserEntity) {
    await this.findById(candidateId, user);
    const tag = this.tagRepo.create({ ...dto, candidate_id: candidateId, added_by: user.email } as any);
    return this.tagRepo.save(tag);
  }

  async deleteTag(tagId: number, user: UserEntity) {
    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException(`Tag ${tagId} not found`);
    await this.findById(tag.candidate_id, user);
    await this.tagRepo.remove(tag);
  }

  // ─── Timeline ───────────────────────────────────────────────────────────
  async getTimeline(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.timelineRepo.find({
      where: { candidate_id: candidateId },
      order: { created_date: 'DESC' },
    });
  }

  async createTimelineEvent(data: Partial<CandidateTimelineEntity>, user: UserEntity) {
    const candidate = await this.findById(data.candidate_id!, user);
    const event = this.timelineRepo.create({
      ...data,
      organization_id: user.organization_id,
      candidate_email: candidate.email,
      performed_by: user.email,
      performed_by_name: user.full_name,
      performed_by_role: user.role,
    });
    return this.timelineRepo.save(event);
  }

  // ─── Documents ──────────────────────────────────────────────────────────
  async getDocuments(candidateId: number, user: UserEntity) {
    await this.findById(candidateId, user);
    return this.documentRepo.find({
      where: { candidate_id: candidateId },
      order: { uploaded_at: 'DESC' },
    });
  }

  async createDocument(data: Partial<CandidateDocumentEntity>, user: UserEntity) {
    const candidate = await this.findById(data.candidate_id!, user);
    const doc = this.documentRepo.create({
      ...data,
      organization_id: user.organization_id,
      candidate_email: candidate.email,
      uploaded_by: user.email,
    } as any);
    return this.documentRepo.save(doc);
  }

  // ─── Import Batches ──────────────────────────────────────────────────────
  async getBatches(user: UserEntity) {
    const where = getRlsWhere('CandidateImportBatch', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(where)) return [];
    return this.batchRepo.find({ where, order: { created_date: 'DESC' } });
  }

  async getBatch(id: number, user: UserEntity) {
    const rlsWhere = getRlsWhere('CandidateImportBatch', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(rlsWhere)) throw new NotFoundException(`Import batch ${id} not found`);
    const batch = await this.batchRepo.findOne({ where: { ...rlsWhere, id } as any });
    if (!batch) throw new NotFoundException(`Import batch ${id} not found`);
    return batch;
  }

  async createBatch(data: Partial<CandidateImportBatchEntity>, user: UserEntity) {
    await this.assertOrganizationUsers([
      data.recruiter_id,
      data.team_manager_id,
      data.recruitment_manager_id,
    ], user);
    const batch = this.batchRepo.create({
      ...data,
      organization_id: user.organization_id,
      recruiter_id: data.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
      team_manager_id: data.team_manager_id ?? (user.role === UserRole.TEAM_MANAGER ? user.id : null),
      recruitment_manager_id: data.recruitment_manager_id ?? (user.role === UserRole.RECRUITMENT_MANAGER ? user.id : null),
      imported_by: user.email,
      status: 'pending',
    });
    return this.batchRepo.save(batch);
  }

  async assertOrganizationUsers(ids: Array<number | null | undefined>, user: UserEntity) {
    if (user.role === UserRole.ADMIN) return;
    for (const id of [...new Set(ids.filter((value): value is number => Boolean(value)))]) {
      const member = await this.userRepo.findOne({ where: { id, organization_id: user.organization_id } });
      if (!member) throw new ForbiddenException(`User ${id} belongs to another organization`);
    }
  }

  async updateBatch(id: number, data: Partial<CandidateImportBatchEntity>, user: UserEntity) {
    const batch = await this.getBatch(id, user);
    const updates = { ...data };
    delete updates.organization_id;
    Object.assign(batch, updates);
    return this.batchRepo.save(batch);
  }

  // ─── Profile ─────────────────────────────────────────────────────────────
  async getProfile(userEmail: string, user: UserEntity) {
    if (user.role === UserRole.CANDIDATE && userEmail !== user.email) {
      throw new ForbiddenException('Access denied');
    }
    return this.profileRepo.findOne({
      where: user.role === UserRole.CANDIDATE ? { user_id: user.id } : { user_email: userEmail },
    });
  }

  /** Flat candidate-profile list with optional filters. */
  async findAllProfiles(filters: { user_email?: string; is_public?: boolean }, user: UserEntity) {
    const where: Record<string, any> = {};
    if (user.role === UserRole.CANDIDATE) where.user_id = user.id;
    else if (filters.user_email) where.user_email = filters.user_email;
    if (filters.is_public !== undefined) where.is_public = filters.is_public;
    return this.profileRepo.find({ where, order: { created_date: 'DESC' } as any });
  }

  async upsertProfile(dto: CreateCandidateProfileDto | UpdateCandidateProfileDto, user: UserEntity) {
    const userEmail = user.email;
    if (!userEmail) throw new BadRequestException('user_email is required');
    const existing = await this.profileRepo.findOne({ where: { user_id: user.id } });
    if (existing) {
      Object.assign(existing, dto);
      return this.profileRepo.save(existing);
    }
    const profile = this.profileRepo.create({ ...dto, user_id: user.id, user_email: userEmail } as any);
    return this.profileRepo.save(profile);
  }

  async updateMyProfile(dto: Partial<CandidateProfileEntity>, user: UserEntity) {
    const existing = await this.profileRepo.findOne({ where: { user_id: user.id } });
    if (!existing) throw new NotFoundException('Candidate profile not found');
    delete dto.user_email;
    delete dto.user_id;
    Object.assign(existing, dto);
    return this.profileRepo.save(existing);
  }

  /** Update by profile id (int) or user_email. */
  async updateProfileByKey(key: string, dto: Partial<CandidateProfileEntity>, user: UserEntity) {
    if (user.role === UserRole.CANDIDATE && key !== user.email) {
      const numericKey = Number(key);
      const owned = Number.isInteger(numericKey)
        ? await this.profileRepo.findOne({ where: { id: numericKey, user_id: user.id } })
        : null;
      if (!owned) throw new ForbiddenException('Access denied');
    }
    const numericId = parseInt(key, 10);
    let existing: CandidateProfileEntity | null = null;
    if (!isNaN(numericId)) {
      existing = await this.profileRepo.findOne({ where: { id: numericId } });
    }
    if (!existing) existing = await this.profileRepo.findOne({ where: { user_email: key } });
    if (!existing) throw new NotFoundException(`Candidate profile ${key} not found`);
    if (user.role === UserRole.CANDIDATE && existing.user_id !== user.id) throw new ForbiddenException('Access denied');
    delete dto.user_email;
    Object.assign(existing, dto);
    return this.profileRepo.save(existing);
  }

  // ─── Access ──────────────────────────────────────────────────────────────
  async getAccess(candidateId: number) {
    return this.accessRepo.find({ where: { candidate_id: candidateId } });
  }

  /** Flat candidate-access list with optional filters. */
  async findAllAccess(filters: Record<string, any> = {}, user: UserEntity) {
    const isGlobalAdmin = user.role === UserRole.ADMIN && !user.impersonating;
    if (!isGlobalAdmin && !user.organization_id) return [];
    const base = filters.candidate_id ? { candidate_id: filters.candidate_id } : {};
    const where: any = isGlobalAdmin
      ? base
      : [
          { ...base, owner_organization_id: user.organization_id },
          { ...base, accessor_organization_id: user.organization_id },
        ];
    return this.accessRepo.find({ where, order: { created_date: 'DESC' } as any });
  }

  async createAccess(data: Partial<CandidateAccessEntity>, user: UserEntity) {
    const candidate = await this.findById(data.candidate_id!, user);
    if (!candidate.organization_id) throw new ForbiddenException('Candidate has no organization scope');
    const access = this.accessRepo.create({
      ...data,
      owner_organization_id: candidate.organization_id,
      granted_by: user.id,
      granted_at: new Date(),
    });
    return this.accessRepo.save(access);
  }

  async updateAccess(id: number, data: Partial<CandidateAccessEntity>, user: UserEntity) {
    const access = await this.accessRepo.findOne({ where: { id } });
    if (!access) throw new NotFoundException(`Access ${id} not found`);
    this.assertAccessGrantOwner(access, user);
    const updates = { ...data };
    delete updates.owner_organization_id;
    delete updates.candidate_id;
    delete updates.granted_by;
    Object.assign(access, updates);
    return this.accessRepo.save(access);
  }

  async deleteAccess(id: number, user: UserEntity) {
    const access = await this.accessRepo.findOne({ where: { id } });
    if (!access) throw new NotFoundException(`Access ${id} not found`);
    this.assertAccessGrantOwner(access, user);
    await this.accessRepo.remove(access);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────
  private assertAccessGrantOwner(access: CandidateAccessEntity, user: UserEntity) {
    const isGlobalAdmin = user.role === UserRole.ADMIN && !user.impersonating;
    if (!isGlobalAdmin && access.owner_organization_id !== user.organization_id) {
      throw new ForbiddenException('Access denied');
    }
  }
}
