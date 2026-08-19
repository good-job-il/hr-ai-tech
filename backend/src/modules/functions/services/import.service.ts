import { ForbiddenException, Injectable, NotFoundException, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import * as ExcelJS from "exceljs"
import { Readable } from "node:stream"
import { CandidateEntity } from "../../candidates/entities/candidate.entity"
import { CandidateImportBatchEntity } from "../../candidates/entities/candidate-import-batch.entity"
import { CandidateDocumentEntity } from "../../candidates/entities/candidate-document.entity"
import { UserEntity } from "../../users/user.entity"
import { UserRole } from "../../../common/enums/user-role.enum"
import { assertOwnedFileUrl } from "../../../common/utils/owned-file-url.util"
import { CandidatesService } from "../../candidates/candidates.service"
import { ResumeExtractionService } from "./resume-extraction.service"
import {
  ImportCandidatesFromFileDto,
  CreateBulkCandidatesDto,
  ValidateImportBatchDto,
  ImportResumeFilesDto,
  ParseResumeBatchDto,
} from "../dto/functions.dto"

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name)

  constructor(
    @InjectRepository(CandidateEntity) private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(CandidateImportBatchEntity)
    private readonly batchRepo: Repository<CandidateImportBatchEntity>,
    @InjectRepository(CandidateDocumentEntity)
    private readonly documentRepo: Repository<CandidateDocumentEntity>,
    private readonly resumeExtraction: ResumeExtractionService,
    private readonly candidatesService: CandidatesService,
  ) {}

  // ─── importCandidatesFromFile — parses CSV/XLSX spreadsheets ─────────────
  async importCandidatesFromFile(dto: ImportCandidatesFromFileDto, user: UserEntity) {
    const batch = await this.requireBatch(dto.batchId, user)

    batch.status = "processing"
    batch.processing_started_at = new Date()
    await this.batchRepo.save(batch)

    let successful = 0

    let duplicates = 0

    let failed = 0

    let missingEmail = 0

    const rowErrors: Array<{
      row_number: number
      message: string
      email?: string | null
      full_name?: string | null
    }> = []

    try {
      const fileUrl = assertOwnedFileUrl(dto.fileUrl)

      const res = await fetch(fileUrl, { signal: AbortSignal.timeout(30_000) })

      if (!res.ok) {
        throw new Error(`Import file returned HTTP ${res.status}`)
      }

      const declaredSize = Number(res.headers.get("content-length") || 0)

      if (declaredSize > 100 * 1024 * 1024) {
        throw new Error("Import file exceeds 100MB")
      }

      const buffer = Buffer.from(await res.arrayBuffer())

      if (buffer.byteLength > 100 * 1024 * 1024) {
        throw new Error("Import file exceeds 100MB")
      }

      const workbook = new ExcelJS.Workbook()

      const contentType = res.headers.get("content-type") || ""

      const isCsv =
        contentType.includes("text/csv") || new URL(fileUrl).pathname.toLowerCase().endsWith(".csv")

      const sheet = isCsv
        ? await workbook.csv.read(Readable.from(buffer))
        : (await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer), workbook.worksheets[0])

      if (!sheet) {
        throw new Error("Import workbook does not contain a worksheet")
      }

      const headers = (sheet.getRow(1).values as ExcelJS.CellValue[])
        .slice(1)
        .map((value) => this.cellText(value))

      let rows: Record<string, any>[] = []

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return
        }

        const record: Record<string, any> = {}

        headers.forEach((header, index) => {
          if (header) {
            record[header] = row.getCell(index + 1).value
          }
        })
        record.__row_number = rowNumber
        rows.push(record)
      })

      if (dto.retryFailedOnly) {
        const failedRows = new Set(
          (batch.error_log || []).map((error) => Number(error.row_number)).filter(Number.isFinite),
        )

        if (failedRows.size) {
          rows = rows.filter((row) => failedRows.has(Number(row.__row_number)))
        }
      }

      for (const row of rows) {
        try {
          const rowNumber = Number(row.__row_number)

          const email = row.email || row.Email || row["אימייל"]

          const fullName = row.full_name || row.name || row["שם מלא"] || "לא ידוע"

          const importedRow = await this.candidateRepo.findOne({
            where: {
              organization_id: user.organization_id,
              import_batch_id: dto.batchId,
              import_row_number: rowNumber,
            },
          })

          if (importedRow) {
            duplicates++
            continue
          }

          if (!email) {
            missingEmail++
          }

          if (email) {
            const existing = await this.candidateRepo.findOne({
              where: {
                email,
                organization_id: user.organization_id,
                ...(user.role === UserRole.TEAM_MANAGER ? { team_id: user.team_id } : {}),
                is_deleted: false,
              },
            })

            if (existing) {
              duplicates++
              continue
            }
          }

          const candidate = this.candidateRepo.create({
            full_name: fullName,
            email: email || null,
            phone: row.phone || row["טלפון"] || null,
            location: row.location || row["מיקום"] || null,
            role_name: row.role || row.role_name || row["תפקיד"] || null,
            experience_years: row.experience_years || null,
            skills: row.skills
              ? String(row.skills)
                  .split(",")
                  .map((s: string) => s.trim())
              : [],
            source: "import" as any,
            team_id: batch.team_id,
            recruiter_id: batch.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
            team_manager_id:
              batch.team_manager_id ?? (user.role === UserRole.TEAM_MANAGER ? user.id : null),
            recruitment_manager_id:
              batch.recruitment_manager_id ??
              (user.role === UserRole.RECRUITMENT_MANAGER ? user.id : null),
            organization_id: user.organization_id,
            import_batch_id: dto.batchId,
            import_row_number: rowNumber,
            imported_at: new Date(),
            imported_by: user.email,
          } as any)

          await this.candidateRepo.save(candidate)
          successful++
        } catch (rowErr) {
          if ((rowErr as any)?.code === "ER_DUP_ENTRY") {
            duplicates++
            continue
          }

          this.logger.warn(`Row import failed: ${(rowErr as Error).message}`)
          failed++
          rowErrors.push({
            row_number: Number(row.__row_number),
            message: (rowErr as Error).message,
            email: row.email || row.Email || row["אימייל"] || null,
            full_name: row.full_name || row.name || row["שם מלא"] || null,
          })
        }
      }

      if (!dto.retryFailedOnly) {
        batch.total_records = rows.length
      }

      batch.successful_imports = dto.retryFailedOnly
        ? batch.successful_imports + successful
        : successful
      batch.failed_imports = failed
      batch.duplicate_found = dto.retryFailedOnly ? batch.duplicate_found + duplicates : duplicates
      batch.missing_email = dto.retryFailedOnly ? batch.missing_email + missingEmail : missingEmail
      batch.error_log = rowErrors
      batch.status = failed > 0 ? "partial" : "completed"
      batch.processing_completed_at = new Date()
      await this.batchRepo.save(batch)

      return {
        message: `Import completed: ${successful} succeeded, ${failed} failed`,
        successful,
        duplicates,
        failed,
        missingEmail,
      }
    } catch (err) {
      batch.status = "failed"
      batch.error_log = [{ message: (err as Error).message }]
      batch.processing_completed_at = new Date()
      await this.batchRepo.save(batch)
      throw err
    }
  }

  // ─── createBulkCandidates — creates candidates from pre-parsed data ──────
  async createBulkCandidates(dto: CreateBulkCandidatesDto, user: UserEntity) {
    const created: any[] = []

    const failed: any[] = []

    const importBatch = dto.import_batch_id
      ? await this.requireBatch(dto.import_batch_id, user)
      : null

    for (const data of dto.candidates_data) {
      try {
        const assignees = await this.candidatesService.assertOrganizationUsers(
          [data.recruiter_id, data.team_manager_id, data.recruitment_manager_id],
          user,
        )

        const candidate = this.candidateRepo.create({
          ...data,
          organization_id: user.organization_id,
          team_id:
            importBatch?.team_id
            ?? (user.role === UserRole.TEAM_MANAGER ? user.team_id : null)
            ?? assignees.find(member => member.team_id)?.team_id
            ?? null,
          team_manager_id:
            user.role === UserRole.TEAM_MANAGER ? user.id : data.team_manager_id,
          import_batch_id: dto.import_batch_id ?? null,
          imported_at: new Date(),
          imported_by: user.email,
          source: "import",
        } as any)

        const saved = await this.candidateRepo.save(candidate)

        created.push(saved)
      } catch (err) {
        failed.push({ data, error: (err as Error).message })
      }
    }

    if (dto.import_batch_id) {
      const batch = await this.batchRepo.findOne({ where: { id: dto.import_batch_id } })

      if (batch) {
        batch.successful_imports += created.length
        batch.failed_imports += failed.length
        batch.status = failed.length ? "partial" : "completed"
        batch.processing_completed_at = new Date()
        await this.batchRepo.save(batch)
      }
    }

    return { created, failed }
  }

  // ─── validateImportBatch — readiness checks for a batch ──────────────────
  async validateImportBatch(dto: ValidateImportBatchDto, user: UserEntity) {
    await this.requireBatch(dto.import_batch_id, user)

    const candidates = await this.candidateRepo.find({
      where: { import_batch_id: dto.import_batch_id },
    })

    const total = candidates.length || 1

    const checks = {
      resume_upload: this.check(candidates, (c) => !!c.resume_url),
      docx_conversion: this.check(candidates, (c) => !!c.converted_resume_url),
      parsing_success: this.check(candidates, (c) => c.parsing_status === "success"),
      email_validation: this.check(candidates, (c) => !!c.email),
      phone_validation: this.check(candidates, (c) => !!c.phone),
      role_validation: this.check(candidates, (c) => !!c.role_name),
      duplicate_detection: this.check(candidates, (c) => !c.is_duplicate_suspected),
      recruiter_assignment: this.check(candidates, (c) => !!c.recruiter_id),
      data_quality: {
        passed: candidates.every((c) => (c.data_quality_score ?? 0) >= 50),
        avg_score: Math.round(
          candidates.reduce((s, c) => s + (c.data_quality_score || 0), 0) / total,
        ),
      },
    }

    const passedChecks = Object.values(checks).filter((c: any) => c.passed).length

    const totalChecks = Object.values(checks).length

    const readinessScore = Math.round((passedChecks / totalChecks) * 100)

    const recommendations: string[] = []

    if (!checks.email_validation.passed) {
      recommendations.push(
        `⚠️ ${candidates.filter((c) => !c.email).length} candidates missing email`,
      )
    }

    if (!checks.phone_validation.passed) {
      recommendations.push(
        `⚠️ ${candidates.filter((c) => !c.phone).length} candidates missing phone`,
      )
    }

    if (!checks.role_validation.passed) {
      recommendations.push(
        `⚠️ ${candidates.filter((c) => !c.role_name).length} candidates missing role`,
      )
    }

    if (!checks.duplicate_detection.passed) {
      recommendations.push(
        `⚠️ ${candidates.filter((c) => c.is_duplicate_suspected).length} suspected duplicates`,
      )
    }

    if (checks.data_quality.avg_score < 60) {
      recommendations.push(`⚠️ Average data quality is ${checks.data_quality.avg_score}%`)
    }

    return {
      batch_id: dto.import_batch_id,
      readiness_score: readinessScore,
      passed_checks: passedChecks,
      total_checks: totalChecks,
      is_production_ready: readinessScore >= 80 && recommendations.length === 0,
      checks,
      recommendations,
      summary: { total_candidates: candidates.length },
    }
  }

  private check(candidates: CandidateEntity[], predicate: (c: CandidateEntity) => boolean) {
    const passing = candidates.filter(predicate).length

    return {
      passed: passing === candidates.length,
      total: candidates.length,
      success: passing,
      failed: candidates.length - passing,
    }
  }

  private cellText(value: ExcelJS.CellValue | undefined): string {
    if (value === null || value === undefined) {
      return ""
    }

    if (typeof value === "object") {
      if ("text" in value) {
        return String(value.text)
      }

      if ("result" in value) {
        return String(value.result ?? "")
      }

      if ("richText" in value) {
        return value.richText.map((part) => part.text).join("")
      }
    }

    return String(value)
  }

  // ─── importResumeFiles — bulk resume upload + extraction ────────────────
  async importResumeFiles(dto: ImportResumeFilesDto, user: UserEntity) {
    const batch = dto.batchId ? await this.requireBatch(dto.batchId, user) : null

    await this.candidatesService.assertOrganizationUsers([dto.recruiter_id], user)

    const results: any[] = []

    let successful = 0

    let failed = 0

    let duplicates = 0

    for (const file of dto.files) {
      try {
        const existingDoc =
          user.role === UserRole.TEAM_MANAGER
            ? null
            : await this.documentRepo.findOne({
                where: { file_url: file.file_url, organization_id: user.organization_id },
              })

        const existingCandidate = await this.candidateRepo.findOne({
          where: {
            resume_url: file.file_url,
            organization_id: user.organization_id,
            ...(user.role === UserRole.TEAM_MANAGER ? { team_id: user.team_id } : {}),
          },
        })

        if (existingDoc || existingCandidate) {
          duplicates++
          results.push({ filename: file.filename, status: "duplicate" })
          continue
        }

        const extraction = await this.resumeExtraction.extractAndTranslate({
          file_url: file.file_url,
        })

        const candidate = this.candidateRepo.create({
          full_name: extraction.data.full_name || file.filename || "לא ידוע",
          email: extraction.data.email || null,
          phone: extraction.data.phone || null,
          location: extraction.data.location || null,
          experience_years: extraction.data.experience_years || null,
          skills: extraction.data.skills || [],
          summary: extraction.data.summary || null,
          resume_url: file.file_url,
          resume_filename: file.filename,
          resume_file_size: file.file_size ?? null,
          resume_upload_source: "import_zip",
          source: "upload" as any,
          organization_id: user.organization_id,
          team_id: batch?.team_id ?? (user.role === UserRole.TEAM_MANAGER ? user.team_id : null),
          recruiter_id: dto.recruiter_id || user.id,
          team_manager_id:
            batch?.team_manager_id ?? (user.role === UserRole.TEAM_MANAGER ? user.id : null),
          import_batch_id: dto.batchId ?? null,
          parsing_status: "success" as any,
          imported_at: new Date(),
          imported_by: user.email,
        } as any) as unknown as CandidateEntity

        const saved = (await this.candidateRepo.save(candidate)) as unknown as CandidateEntity

        await this.documentRepo.save(
          this.documentRepo.create({
            organization_id: user.organization_id,
            candidate_id: saved.id,
            candidate_email: saved.email,
            doc_type: "resume",
            filename: file.filename,
            file_url: file.file_url,
            file_size: file.file_size ?? null,
            uploaded_by: user.email,
            uploaded_at: new Date(),
            is_latest_cv: true,
            import_batch_id: dto.batchId ?? null,
          } as any),
        )

        successful++
        results.push({ filename: file.filename, status: "success", candidate_id: saved.id })
      } catch (err) {
        failed++
        results.push({ filename: file.filename, status: "failed", error: (err as Error).message })
      }
    }

    return { results, successful, failed, duplicates, conversionFailed: 0, parsingFailed: failed }
  }

  // ─── parseResumeBatch — parse a ZIP of resumes (metadata pass) ───────────
  async parseResumeBatch(dto: ParseResumeBatchDto, user: UserEntity) {
    const assignees = await this.candidatesService.assertOrganizationUsers([dto.recruiter_id], user)

    // NOTE: Actual ZIP extraction requires unzip on the server (e.g. `unzipper`
    // or `adm-zip`). This implementation validates the batch shell and
    // prepares it for `importResumeFiles` once individual file URLs are known
    // (typically after client-side unzip + upload, matching the frontend flow
    // in ResumeZipUploader.jsx which uploads extracted files individually).
    let batch: CandidateImportBatchEntity | null = null

    if (dto.import_batch_id) {
      batch = await this.requireBatch(dto.import_batch_id, user)
    }

    if (!batch) {
      batch = this.batchRepo.create({
        organization_id: user.organization_id,
        team_id:
          user.role === UserRole.TEAM_MANAGER
            ? user.team_id
            : assignees.find(member => member.team_id)?.team_id ?? null,
        batch_name: `ZIP Import ${new Date().toISOString()}`,
        source_file: dto.zip_file_url,
        file_type: "zip",
        imported_by: user.email,
        recruiter_id: dto.recruiter_id ?? user.id,
        team_manager_id: user.role === UserRole.TEAM_MANAGER ? user.id : null,
        employer_id: dto.employer_id ?? null,
        status: "pending",
      } as any) as unknown as CandidateImportBatchEntity
      batch = (await this.batchRepo.save(batch)) as unknown as CandidateImportBatchEntity
    }

    return {
      import_batch_id: batch.id,
      candidates: [],
      duplicates: [],
      errors: [],
      message:
        "Batch registered. Upload extracted resume files via importResumeFiles with this batchId.",
    }
  }

  private async requireBatch(id: number | null | undefined, user: UserEntity) {
    if (!id) {
      throw new NotFoundException("Import batch not found")
    }

    const batch = await this.batchRepo.findOne({ where: { id } })

    if (!batch) {
      throw new NotFoundException("Import batch not found")
    }

    if (user.role !== UserRole.ADMIN && batch.organization_id !== user.organization_id) {
      throw new ForbiddenException("Import batch belongs to another organization")
    }

    if (user.role === UserRole.TEAM_MANAGER && (!user.team_id || batch.team_id !== user.team_id)) {
      throw new NotFoundException("Import batch not found")
    }

    return batch
  }
}
