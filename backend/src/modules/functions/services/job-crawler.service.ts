import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import * as cheerio from "cheerio"
import { JobEntity } from "../../jobs/entities/job.entity"
import { ImportSourceEntity } from "../../import-sources/import-source.entity"
import { UserEntity } from "../../users/user.entity"
import { CrawlCareerPageDto } from "../dto/functions.dto"
import { lookup } from "dns/promises"
import { isIP } from "net"
import { BadRequestException } from "@nestjs/common"

const JOB_KEYWORDS = ["job", "career", "position", "role", "משרה", "דרוש", "דרושים", "קריירה"]

@Injectable()
export class JobCrawlerService {
  private readonly logger = new Logger(JobCrawlerService.name)

  constructor(
    @InjectRepository(JobEntity) private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(ImportSourceEntity)
    private readonly sourceRepo: Repository<ImportSourceEntity>,
  ) {}

  /**
   * Basic career-page crawler: fetches the page HTML and extracts anchor tags
   * whose text or href look like job postings, creating a Job draft per link.
   *
   * NOTE: This is a heuristic, single-page crawler (no pagination/JS rendering).
   * For production-grade scraping of JS-heavy career sites, a headless browser
   * (Playwright/Puppeteer) integration would be required — flagged as a
   * follow-up task in the migration report.
   */
  async crawlCareerPage(dto: CrawlCareerPageDto, user: UserEntity) {
    const log: string[] = []

    const errors: string[] = []

    let created = 0

    let updated = 0

    try {
      log.push(`Fetching ${dto.url}`)

      const response = await this.fetchPublicPage(dto.url)

      if (!response.ok) {
        throw new Error(`Career page returned HTTP ${response.status}`)
      }

      const html = await response.text()

      const $ = cheerio.load(html)

      const links = new Map<string, string>()

      $("a").each((_, el) => {
        const href = $(el).attr("href")

        const text = $(el).text().trim()

        if (!href || !text || text.length < 3) {
          return
        }

        const haystack = `${href} ${text}`.toLowerCase()

        if (JOB_KEYWORDS.some((kw) => haystack.includes(kw))) {
          const absoluteUrl = new URL(href, dto.url).toString()

          links.set(absoluteUrl, text)
        }
      })

      log.push(`Found ${links.size} candidate job links`)

      for (const [url, title] of links) {
        try {
          const existing = await this.jobRepo.findOne({ where: { apply_url: url } })

          if (existing) {
            updated++
            continue
          }

          await this.jobRepo.save(
            this.jobRepo.create({
              title,
              company: dto.company_name,
              organization_id: user.organization_id,
              type: "full",
              is_closed: false,
              apply_url: url,
              source: undefined,
              external_id: url,
            } as any),
          )
          created++
        } catch (linkErr) {
          errors.push(`${url}: ${(linkErr as Error).message}`)
        }
      }

      if (dto.source_id) {
        const source = await this.sourceRepo.findOne({ where: { id: dto.source_id } })

        if (source) {
          source.last_sync = new Date()
          source.last_sync_status = errors.length ? "error" : "success"
          source.last_error = errors.length ? errors.join("\n") : null
          source.retry_count = errors.length ? source.retry_count : 0
          source.jobs_added += created
          source.jobs_updated += updated
          source.logs = [...(source.logs || []), ...log].slice(-50)
          await this.sourceRepo.save(source)
        }
      }

      return {
        success: errors.length === 0,
        summary: `Scanned ${dto.url}: ${created} created, ${updated} already existed`,
        pages_scanned: 1,
        job_links_found: links.size,
        created,
        updated,
        closed: 0,
        errors_count: errors.length,
        errors,
        log,
      }
    } catch (err) {
      this.logger.error(`crawlCareerPage failed: ${(err as Error).message}`)
      errors.push((err as Error).message)

      return {
        success: false,
        summary: `Failed to crawl ${dto.url}`,
        pages_scanned: 0,
        job_links_found: 0,
        created,
        updated,
        closed: 0,
        errors_count: errors.length,
        errors,
        log,
      }
    }
  }

  private async fetchPublicPage(input: string, redirects = 0): Promise<Response> {
    if (redirects > 3) {
      throw new BadRequestException("Too many redirects")
    }

    const url = new URL(input)

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new BadRequestException("Unsupported URL protocol")
    }

    const addresses = isIP(url.hostname)
      ? [{ address: url.hostname }]
      : await lookup(url.hostname, { all: true })

    if (addresses.some(({ address }) => this.isPrivateAddress(address))) {
      throw new BadRequestException("Private network URLs are not allowed")
    }

    const response = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 HireIsraelBot/1.0" },
      signal: AbortSignal.timeout(20_000),
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")

      if (!location) {
        throw new BadRequestException("Redirect has no location")
      }

      return this.fetchPublicPage(new URL(location, url).toString(), redirects + 1)
    }

    return response
  }

  private isPrivateAddress(address: string) {
    const normalized = address.toLowerCase()

    if (normalized === "::1" || normalized === "0.0.0.0") {
      return true
    }

    if (
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    ) {
      return true
    }

    const parts = normalized.split(".").map(Number)

    if (parts.length !== 4 || parts.some(Number.isNaN)) {
      return false
    }

    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    )
  }
}
