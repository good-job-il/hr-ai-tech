import { OrgType } from "@/common/enums/org-type.enum"
import { UserRole } from "@/common/enums/user-role.enum"
import { JwtStrategy } from "./jwt.strategy"

describe("JwtStrategy organization context", () => {
  it("derives a missing user org_type from the server-owned organization", async () => {
    const user = {
      id: 8,
      email: "recruiter@test.local",
      role: UserRole.RECRUITER,
      organization_id: 3,
      org_type: null,
      is_active: true,
    }

    const userRepository = {
      findOne: jest.fn().mockResolvedValue(user),
    }

    const organizationRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 3,
        org_type: OrgType.STAFFING_AGENCY,
      }),
    }

    const configService = {
      get: jest.fn((_key: string, fallback: string) => fallback),
    }

    const strategy = new JwtStrategy(
      configService as any,
      userRepository as any,
      organizationRepository as any,
    )

    const result = await strategy.validate({
      sub: 8,
      email: user.email,
      role: user.role,
      organization_id: 3,
    })

    expect(result.org_type).toBe(OrgType.STAFFING_AGENCY)
    expect(user.org_type).toBeNull()
    expect(organizationRepository.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      select: ["id", "org_type"],
    })
  })
})
