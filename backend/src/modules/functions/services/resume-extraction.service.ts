import { Injectable, Logger } from "@nestjs/common"
import * as crypto from "crypto"
import { ExtractResumeFnDto } from "../dto/functions.dto"
import { assertOwnedFileUrl } from "../../../common/utils/owned-file-url.util"

export interface ExtractedResumeData {
  full_name?: string
  phone?: string
  email?: string
  location?: string
  title?: string
  summary?: string
  skills?: string[]
  experience_years?: number
  education?: string
  original_language?: string
  resume_hash: string
  parsed_text: string
  extraction_timestamp: string
}

/**
 * Resume extraction service.
 *
 * If OPENAI_API_KEY is configured, uses GPT structured extraction (JSON mode)
 * against the resume text. Otherwise falls back to a lightweight regex-based
 * extractor that still populates email/phone/name reasonably well.
 *
 * NOTE: PDF/DOCX text extraction is best-effort. For full production-grade
 * parsing, wire up a dedicated text-extraction pipeline (e.g. pdf-parse /
 * mammoth) fed into `extractTextFromFile`.
 */
@Injectable()
export class ResumeExtractionService {
  private readonly logger = new Logger(ResumeExtractionService.name)

  async extractAndTranslate(
    dto: ExtractResumeFnDto,
  ): Promise<{ success: boolean; data: ExtractedResumeData }> {
    const resumeHash = this.hashContent(dto.file_url)

    const text = await this.extractTextFromFile(dto.file_url)

    let extracted: Partial<ExtractedResumeData> = {}

    if (process.env.OPENAI_API_KEY) {
      extracted = await this.extractWithLLM(text)
    } else {
      extracted = this.extractWithHeuristics(text)
    }

    return {
      success: true,
      data: {
        ...extracted,
        resume_hash: resumeHash,
        parsed_text: text.slice(0, 2000),
        extraction_timestamp: new Date().toISOString(),
      },
    }
  }

  private hashContent(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex")
  }

  /** Best-effort file download + text extraction. Falls back to empty string on failure. */
  async extractTextFromFile(fileUrl: string): Promise<string> {
    const ownedUrl = assertOwnedFileUrl(fileUrl)

    try {
      const res = await fetch(ownedUrl, { signal: AbortSignal.timeout(20_000) })

      if (!res.ok) {
        throw new Error(`Resume file returned HTTP ${res.status}`)
      }

      const buffer = Buffer.from(await res.arrayBuffer())

      if (buffer.byteLength > 25 * 1024 * 1024) {
        throw new Error("Resume file exceeds 25MB")
      }

      const contentType = res.headers.get("content-type") || ""

      if (contentType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf")) {
        // Lightweight fallback: strip binary noise, keep printable text runs.
        return this.stripBinaryToText(buffer)
      }

      // Plain text / unknown — attempt UTF-8 decode directly
      return buffer.toString("utf-8")
    } catch (err) {
      this.logger.warn(`Failed to fetch/extract file text: ${(err as Error).message}`)

      return ""
    }
  }

  private stripBinaryToText(buffer: Buffer): string {
    const raw = buffer.toString("latin1")

    const matches = raw.match(/[\x20-\x7E\u0590-\u05FF]{4,}/g) || []

    return matches.join(" ").slice(0, 20000)
  }

  private extractWithHeuristics(text: string): Partial<ExtractedResumeData> {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)

    const phoneMatch = text.match(/(?:\+972|0)([-\s]?\d){8,9}/)

    const nameMatch = text.match(/^[A-Za-z\u0590-\u05FF ]{3,60}/)

    return {
      full_name: nameMatch?.[0]?.trim(),
      email: emailMatch?.[0],
      phone: phoneMatch?.[0]?.replace(/\s/g, ""),
      skills: [],
      original_language: /[\u0590-\u05FF]/.test(text) ? "he" : "en",
    }
  }

  /** OpenAI-based structured extraction (only used when OPENAI_API_KEY is set) */
  private async extractWithLLM(text: string): Promise<Partial<ExtractedResumeData>> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You extract structured resume data. Reply ONLY with strict JSON matching: " +
                "{ full_name, phone, email, location, title, summary, skills (array), experience_years (number), education, original_language }. " +
                "If the resume is in Hebrew keep fields in Hebrew; if in English, translate name/title/summary to Hebrew.",
            },
            { role: "user", content: text.slice(0, 8000) },
          ],
          temperature: 0.2,
        }),
      })

      const json = (await response.json()) as any

      const content = json?.choices?.[0]?.message?.content

      if (!content) {
        return this.extractWithHeuristics(text)
      }

      return JSON.parse(content)
    } catch (err) {
      this.logger.warn(
        `LLM extraction failed, falling back to heuristics: ${(err as Error).message}`,
      )

      return this.extractWithHeuristics(text)
    }
  }
}
