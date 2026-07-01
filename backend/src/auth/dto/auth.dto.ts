import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ─── Login ────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});
export class LoginDto extends createZodDto(LoginSchema) {}

// ─── Register ─────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  full_name: z.string().min(1, { message: 'Full name is required' }),
  phone: z.string().optional(),
  role: z
    .enum([
      'candidate',
      'employer',
      'recruiter',
      'team_manager',
      'recruitment_manager',
      'org_admin',
      'admin',
      'super_admin',
      'hr_manager',
      'internal_recruiter',
    ])
    .default('candidate'),
  organization_id: z.string().uuid().optional(),
});
export class RegisterDto extends createZodDto(RegisterSchema) {}

// ─── Forgot Password ──────────────────────────────────────────────────────
export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

// ─── Reset Password ───────────────────────────────────────────────────────
export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}

// ─── Refresh Token ────────────────────────────────────────────────────────
export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}

// ─── Update Me ────────────────────────────────────────────────────────────
export const UpdateMeSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  display_role_name: z.string().optional(),
  last_login: z.string().datetime().optional(),
  org_type: z.enum(['organization', 'staffing_agency']).optional().nullable(),
  profile_completed: z.boolean().optional(),
  is_active: z.boolean().optional(),
});
export class UpdateMeDto extends createZodDto(UpdateMeSchema) {}

