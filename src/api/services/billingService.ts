import { httpClient } from '@/api/client/httpClient';

export interface BillingOverview {
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  limits: { active_jobs: number | null; candidates: number | null; seats: number | null; ai_matching: boolean };
  usage: { active_jobs: number; candidates: number; seats: number };
  subscription: { provider: string | null; status: string; payment_status: string; current_period_end: string | null; cancel_at_period_end: boolean };
  invoices: Array<{ id: number; provider_invoice_id: string; invoice_number: string | null; amount_minor: number; currency: string; status: string; issued_at: string; due_at: string | null; hosted_invoice_url: string | null; invoice_pdf_url: string | null }>;
  capabilities: { plan_changes: boolean; payment_method_management: boolean; invoice_download: boolean };
}

export const billingService = { overview: () => httpClient.get<BillingOverview>('/billing/overview', { cache: false }) };
