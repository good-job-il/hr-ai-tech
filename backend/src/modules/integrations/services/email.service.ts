import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from "nodemailer"

type DeliveryResult = { success: boolean; message: string }

type ApplicationSubmittedEmail = {
  candidateEmail: string
  candidateName: string
  jobTitle: string
  employerEmail?: string | null
}

type InterviewScheduledEmail = {
  candidateEmail?: string | null
  candidateName: string
  jobTitle?: string | null
  date: string
  time: string
  type: string
  locationOrLink?: string | null
}

type StaffInviteEmail = { email: string; fullName: string; token: string }
type PasswordResetEmail = { email: string; token: string }
type CandidatePresentationEmail = {
  recipientEmail: string
  candidateName: string
  candidateEmail?: string | null
  jobTitle: string
  recruiterName: string
  recruiterNote?: string | null
  resumeUrl?: string | null
}

/**
 * Backend-owned transactional email templates.
 *
 * Browser payloads must never provide an arbitrary recipient, subject or body.
 * Domain services call one of the explicit methods below after the associated
 * authorized business event has been persisted.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly transporter: nodemailer.Transporter | null

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST")

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: this.config.get<number>("SMTP_PORT", 587),
          secure: this.config.get<number>("SMTP_PORT", 587) === 465,
          auth: {
            user: this.config.get<string>("SMTP_USER"),
            pass: this.config.get<string>("SMTP_PASS"),
          },
        })
      : null
  }

  async sendApplicationSubmitted(event: ApplicationSubmittedEmail): Promise<DeliveryResult[]> {
    const deliveries = [
      this.deliver(
        event.candidateEmail,
        `Application received — ${event.jobTitle}`,
        `Hello ${event.candidateName},\n\nYour application for ${event.jobTitle} was received. The recruitment team will review it and contact you through the platform.\n\nHire Israel`,
        "application_submitted_candidate",
      ),
    ]

    if (event.employerEmail && this.isEmail(event.employerEmail)) {
      deliveries.push(
        this.deliver(
          event.employerEmail,
          `New application — ${event.jobTitle}`,
          `A new application for ${event.jobTitle} is ready for review in Hire Israel. Sign in to view the candidate details.`,
          "application_submitted_employer",
        ),
      )
    }

    return Promise.all(deliveries)
  }

  async sendInterviewScheduled(event: InterviewScheduledEmail): Promise<DeliveryResult | null> {
    if (!event.candidateEmail || !this.isEmail(event.candidateEmail)) {
      return null
    }

    const location = event.locationOrLink ? `\nLocation/link: ${event.locationOrLink}` : ""

    return this.deliver(
      event.candidateEmail,
      `Interview scheduled — ${event.jobTitle || "Hire Israel"}`,
      `Hello ${event.candidateName},\n\nAn interview has been scheduled for ${event.jobTitle || "your application"}.\nDate: ${event.date}\nTime: ${event.time}\nType: ${event.type}${location}\n\nPlease sign in to Hire Israel for current details.`,
      "interview_scheduled",
    )
  }

  async sendStaffInvite(event: StaffInviteEmail): Promise<DeliveryResult> {
    const appUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:5173")

    const link = `${appUrl}/reset-password?token=${encodeURIComponent(event.token)}`

    return this.deliver(
      event.email,
      "You were invited to Hire Israel",
      `Hello ${event.fullName},\n\nYou were invited to join your organization in Hire Israel. Set your password within 48 hours:\n${link}\n\nHire Israel`,
      "staff_invite",
    )
  }

  async sendPasswordReset(event: PasswordResetEmail): Promise<DeliveryResult> {
    const appUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:5173")

    const link = `${appUrl}/reset-password?token=${encodeURIComponent(event.token)}`

    return this.deliver(
      event.email,
      "Reset your Hire Israel password",
      `A password reset was requested for your Hire Israel account. Reset it within one hour:\n${link}\n\nIf you did not request this, ignore this email.`,
      "password_reset",
    )
  }

  async sendCandidatePresentation(event: CandidatePresentationEmail): Promise<DeliveryResult> {
    const contact = event.candidateEmail ? `\nCandidate email: ${event.candidateEmail}` : ""

    const resume = event.resumeUrl ? `\nResume: ${event.resumeUrl}` : ""

    const note = event.recruiterNote ? `\nRecruiter note: ${event.recruiterNote}` : ""

    return this.deliver(
      event.recipientEmail,
      `Candidate presentation — ${event.candidateName} — ${event.jobTitle}`,
      `${event.recruiterName} presented ${event.candidateName} for ${event.jobTitle}.${contact}${resume}${note}\n\nSign in to Hire Israel for the complete candidate record.`,
      "candidate_presentation",
    )
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  private async deliver(
    to: string,
    subject: string,
    body: string,
    event: string,
  ): Promise<DeliveryResult> {
    const from = `Hire Israel <${this.config.get<string>("EMAIL_FROM", "noreply@hire-israel.co.il")}>`

    if (!this.transporter) {
      this.logger.log(`[Email:MOCK] event=${event} delivery skipped (SMTP not configured)`)

      return { success: true, message: "Email skipped (SMTP not configured)" }
    }

    try {
      await this.transporter.sendMail({ from, to, subject, text: body })

      return { success: true, message: "Email sent" }
    } catch (error) {
      this.logger.error(`Email delivery failed for event=${event}: ${(error as Error).message}`)

      return { success: false, message: "Email delivery failed" }
    }
  }
}
