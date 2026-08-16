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
      'org_admin',
    ])
    .default('candidate'),
}).strict();
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
  company_culture: z.string().optional().nullable(),
  benefits: z.array(z.string()).optional().nullable(),
  gallery_urls: z.array(z.string().url()).optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  testimonials: z.array(z.record(z.any())).optional().nullable(),
});
export class UpdateMeDto extends createZodDto(UpdateMeSchema) {}
