import { ConfigService } from "@nestjs/config"
import { EmailService } from "./email.service"

describe("EmailService", () => {
  it("uses explicit domain methods and safely skips delivery without SMTP", async () => {
    const service = new EmailService(new ConfigService({ FRONTEND_URL: "http://localhost:5173" }))

    await expect(
      service.sendApplicationSubmitted({
        candidateEmail: "candidate@example.com",
        candidateName: "Candidate",
        jobTitle: "Engineer",
      }),
    ).resolves.toEqual([{ success: true, message: "Email skipped (SMTP not configured)" }])

    await expect(
      service.sendPasswordReset({
        email: "candidate@example.com",
        token: "opaque-reset-token",
      }),
    ).resolves.toEqual({ success: true, message: "Email skipped (SMTP not configured)" })
  })
})
