import { RegisterSchema } from "./auth.dto"

describe("RegisterSchema", () => {
  const valid = {
    email: "candidate@example.com",
    password: "StrongPass123!",
    full_name: "Candidate User",
  }

  it("defaults public registration to candidate", () => {
    expect(RegisterSchema.parse(valid).role).toBe("candidate")
  })

  it.each([
    "admin",
    "recruiter",
    "team_manager",
    "recruitment_manager",
    "hr_manager",
    "internal_recruiter",
  ])("rejects browser-authored privileged role %s", (role) =>
    expect(() => RegisterSchema.parse({ ...valid, role })).toThrow(),
  )

  it("rejects browser-authored tenant ownership", () => {
    expect(() => RegisterSchema.parse({ ...valid, organization_id: 42 })).toThrow()
  })

  it.each(["candidate", "employer", "org_admin"])("accepts public onboarding role %s", (role) => {
    expect(RegisterSchema.parse({ ...valid, role }).role).toBe(role)
  })
})
