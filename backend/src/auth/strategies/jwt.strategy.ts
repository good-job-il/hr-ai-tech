import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { UserEntity } from "@/modules/users/user.entity"
import { UserRole } from "@/common/enums/user-role.enum"
import { OrgType } from "@/common/enums/org-type.enum"

export interface JwtPayload {
  sub: number
  email: string
  role: string
  organization_id: number | null
  org_type?: OrgType
  /**
   * Set only on short-lived "workspace" tokens issued by
   * POST /auth/organizations/:id/enter. Never present on a regular
   * login/refresh token. When true, `organization_id` above is the
   * organization the admin has entered (NOT the admin's own org — admins
   * have none).
   */
  impersonating?: boolean
  iat?: number
  exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "fallback-secret"),
    })
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, is_active: true },
    })

    if (!user) {
      throw new UnauthorizedException("User not found or inactive")
    }

    // ── Admin "acting as organization" context ─────────────────────────
    // Only ever trusted because it was signed by our own backend at
    // token-issue time (see AuthService.enterOrganization) — we never
    // read an org id supplied directly by the client on every request.
    if (payload.impersonating && user.role === UserRole.ADMIN && payload.organization_id) {
      // Return a lightweight overlay, never mutate the real DB row.
      const effectiveUser = Object.assign(Object.create(Object.getPrototypeOf(user)), user, {
        organization_id: payload.organization_id,
        org_type: payload.org_type ?? user.org_type,
        impersonating: true,
        real_organization_id: user.organization_id,
      }) as UserEntity

      return effectiveUser
    }

    return user
  }
}
