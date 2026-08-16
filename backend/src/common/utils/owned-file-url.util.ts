import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

export function assertOwnedFileUrl(value: string): URL {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || !url.pathname.startsWith('/uploads/')) {
    throw new BadRequestException('Only application-owned upload URLs are accepted');
  }
  const configured = process.env.API_PUBLIC_URL;
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new ServiceUnavailableException('API_PUBLIC_URL must be configured for file processing');
  }
  const allowedOrigins = new Set([
    configured ? new URL(configured).origin : '',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ].filter(Boolean));
  if (!allowedOrigins.has(url.origin)) {
    throw new BadRequestException('The file URL does not belong to this application');
  }
  return url;
}
